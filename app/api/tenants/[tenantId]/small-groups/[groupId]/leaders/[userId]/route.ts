import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isGroupLeader, hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { unauthorized, forbidden, notFound, handleApiError } from '@/lib/api-response';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string; userId: string }> }
) {
  const { tenantId, groupId, userId: targetUserId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) return unauthorized();

  try {
    const allowed = (await isGroupLeader(userId, groupId)) || (await hasRole(userId, tenantId, [TenantRole.ADMIN]));
    if (!allowed) return forbidden('Forbidden');

    const membership = await prisma.smallGroupMembership.findUnique({ where: { groupId_userId: { groupId, userId: targetUserId } } });
    if (!membership) return notFound('Membership');

    // Demote to MEMBER rather than deleting membership
    const updated = await prisma.smallGroupMembership.update({ where: { id: membership.id }, data: { role: 'MEMBER' } });

    // If they were the explicit group leaderUserId, clear it
    const group = await prisma.smallGroup.findUnique({ where: { id: groupId } });
    if (group?.leaderUserId === targetUserId) {
      await prisma.smallGroup.update({ where: { id: groupId }, data: { leaderUserId: null } });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`Failed to remove leader role for ${targetUserId} in group ${groupId}:`, error);
    return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/small-groups/[groupId]/leaders/[userId]', tenantId, groupId, targetUserId });
  }
}
