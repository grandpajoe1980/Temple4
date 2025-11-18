import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {  } from '@prisma/client';
import { TenantRole, MembershipStatus } from '@/types';
import { z } from 'zod';
import { sendMembershipApprovedEmail } from '@/lib/email-helpers';

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
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
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
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const result = requestActionSchema.safeParse(await request.json());
  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const { action } = result.data;
  const newStatus = action === 'APPROVE' ? MembershipStatus.APPROVED : MembershipStatus.REJECTED;

  try {
    const updatedRequest = await prisma.userTenantMembership.update({
      where: {
        userId_tenantId: { userId: userId, tenantId: tenantId },
        status: 'PENDING', // Ensure we're only actioning a pending request
      },
      data: {
        status: newStatus,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        tenant: true,
      },
    });

    // Send email notification if approved
    if (action === 'APPROVE' && updatedRequest.user.profile) {
      const tenantUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tenants/${tenantId}`;
      
      sendMembershipApprovedEmail(
        {
          user: {
            displayName: updatedRequest.user.profile.displayName,
          },
          tenantName: updatedRequest.tenant.name,
          tenantUrl,
        },
        updatedRequest.user.email,
        tenantId
      ).catch(error => {
        console.error('Failed to send membership approved email:', error);
        // Don't throw - email failure shouldn't block approval
      });
    }

    // Here you would typically trigger a notification to the user
    // e.g., createNotification(userId, 'Your membership request was ' + newStatus.toLowerCase());

    return NextResponse.json(updatedRequest);
  } catch (error) {
    // This could fail if the request doesn't exist or wasn't in a 'REQUESTED' state
    console.error(`Failed to ${action.toLowerCase()} membership for user ${userId} in tenant ${tenantId}:`, error);
    return NextResponse.json({ message: `Failed to ${action.toLowerCase()} membership request` }, { status: 500 });
  }
}
