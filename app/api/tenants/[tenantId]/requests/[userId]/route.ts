import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { handleApiError, unauthorized, forbidden, validationError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { TenantRole, MembershipStatus, OnboardingStatus } from '@/types';
import { z } from 'zod';
import { deriveOnboardingFields, processApprovedMember } from '@/lib/services/onboarding-service';
import { TenantSettings as PrismaTenantSettings } from '@prisma/client';

const requestActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
});

// 8.4 Approve/Reject Membership Request
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; userId: string }> }
) {
    const { tenantId, userId } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id;

  if (!currentUserId) {
    return unauthorized();
  }

  // Check if the current user has permission to manage requests
  const currentUserMembership = await prisma.userTenantMembership.findUnique({
    where: { userId_tenantId: { userId: currentUserId, tenantId: tenantId } },
    include: { roles: true },
  });

  const hasPermission = currentUserMembership?.roles.some((role: any) => 
    ([TenantRole.ADMIN, TenantRole.STAFF, TenantRole.MODERATOR] as TenantRole[]).includes(role.role)
  );

  if (!hasPermission) {
    return forbidden('Forbidden');
  }

  const result = requestActionSchema.safeParse(await request.json());
  if (!result.success) {
    return validationError(result.error.flatten().fieldErrors);
  }

  const { action } = result.data;
  const newStatus = action === 'APPROVE' ? MembershipStatus.APPROVED : MembershipStatus.REJECTED;

  try {
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenantId },
    });

    const onboardingUpdates =
      newStatus === MembershipStatus.APPROVED
        ? deriveOnboardingFields({
            status: newStatus,
            settings: tenantSettings as PrismaTenantSettings | null,
          })
        : {
            onboardingStatus: OnboardingStatus.PENDING,
            alertSentAt: null,
            alertChannels: [],
            welcomePacketUrl: null,
            welcomePacketVersion: null,
          };

    const updatedRequest = await prisma.userTenantMembership.update({
      where: {
        userId_tenantId: { userId: userId, tenantId: tenantId },
        status: 'PENDING', // Ensure we're only actioning a pending request
      },
      data: {
        status: newStatus,
        ...onboardingUpdates,
      },
    });

    // If approved, send welcome email and notify staff (fire-and-forget)
    if (newStatus === MembershipStatus.APPROVED) {
      // Don't await - this runs in the background
      processApprovedMember({
        userId,
        tenantId,
        approvedByUserId: currentUserId,
        welcomePacketUrl: onboardingUpdates.welcomePacketUrl,
      }).catch((err) => {
        console.error('Failed to process approved member:', err);
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    // This could fail if the request doesn't exist or wasn't in a 'REQUESTED' state
    console.error(`Failed to ${action.toLowerCase()} membership for user ${userId} in tenant ${tenantId}:`, error);
    return handleApiError(error, { route: `PUT /api/tenants/[tenantId]/requests/[userId]`, tenantId, userId });
  }
}
