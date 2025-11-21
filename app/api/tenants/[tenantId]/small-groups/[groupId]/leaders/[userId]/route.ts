import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isGroupLeader, hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string; userId: string }> }
) {
  const { tenantId, groupId, userId: targetUserId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  try {
    const allowed = (await isGroupLeader(userId, groupId)) || (await hasRole(userId, tenantId, [TenantRole.ADMIN]));
    if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const membership = await prisma.smallGroupMembership.findUnique({ where: { groupId_userId: { groupId, userId: targetUserId } } });
    if (!membership) return NextResponse.json({ message: 'Membership not found' }, { status: 404 });

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
    return NextResponse.json({ message: 'Failed to remove leader' }, { status: 500 });
  }
}
