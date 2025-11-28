import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { approveSmallGroupMember } from '@/lib/data';
import { hasRole, isGroupLeader } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { unauthorized, notFound, forbidden, handleApiError } from '@/lib/api-response';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string; userId: string }> }
) {
  const { tenantId, groupId, userId } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id;

  if (!currentUserId) {
    return unauthorized();
  }

  try {
    const membership = await prisma.smallGroupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) {
      return notFound('Membership');
    }

    const userRecord = await prisma.user.findUnique({ where: { id: currentUserId } });
    const isSuperAdmin = !!userRecord?.isSuperAdmin;
    const isTenantAdmin = await hasRole(currentUserId, tenantId, [TenantRole.ADMIN]);
    const leader = await isGroupLeader(currentUserId, groupId);

    if (!leader && !isTenantAdmin && !isSuperAdmin) {
      return forbidden('Forbidden');
    }

    const updated = await approveSmallGroupMember(groupId, userId, currentUserId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error(`Failed to approve member ${userId} for group ${groupId}:`, error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/small-groups/[groupId]/members/[userId]/approve', tenantId, groupId, userId });
  }
}
