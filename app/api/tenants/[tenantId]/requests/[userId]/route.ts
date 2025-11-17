import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TenantRole, MembershipStatus } from '@prisma/client';
import { z } from 'zod';

const requestActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
});

// 8.4 Approve/Reject Membership Request
export async function PUT(
  request: Request,
  { params }: { params: { tenantId: string; userId: string } }
) {
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id;

  if (!currentUserId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  // Check if the current user has permission to manage requests
  const currentUserMembership = await prisma.userTenantMembership.findUnique({
    where: { userId_tenantId: { userId: currentUserId, tenantId: params.tenantId } },
    include: { roles: true },
  });

  const hasPermission = currentUserMembership?.roles.some(role => [TenantRole.ADMIN, TenantRole.STAFF, TenantRole.MODERATOR].includes(role.role));

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
        userId_tenantId: { userId: params.userId, tenantId: params.tenantId },
        status: 'PENDING', // Ensure we're only actioning a pending request
      },
      data: {
        status: newStatus,
      },
    });

    // Here you would typically trigger a notification to the user
    // e.g., createNotification(params.userId, 'Your membership request was ' + newStatus.toLowerCase());

    return NextResponse.json(updatedRequest);
  } catch (error) {
    // This could fail if the request doesn't exist or wasn't in a 'REQUESTED' state
    console.error(`Failed to ${action.toLowerCase()} membership for user ${params.userId} in tenant ${params.tenantId}:`, error);
    return NextResponse.json({ message: `Failed to ${action.toLowerCase()} membership request` }, { status: 500 });
  }
}
