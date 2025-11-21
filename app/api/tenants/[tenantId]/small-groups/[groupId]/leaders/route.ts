import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isGroupLeader, hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string }> }
) {
  const { tenantId, groupId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  try {
    const allowed = (await isGroupLeader(userId, groupId)) || (await hasRole(userId, tenantId, [TenantRole.ADMIN]));
    if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const targetUserId = body.userId as string;
    const role = body.role || 'CO_LEADER';

    if (!targetUserId) return NextResponse.json({ message: 'userId required' }, { status: 400 });

    // Upsert membership with leader/co-leader role and approve
    const existing = await prisma.smallGroupMembership.findUnique({ where: { groupId_userId: { groupId, userId: targetUserId } } });
    if (existing) {
      const updated = await prisma.smallGroupMembership.update({ where: { id: existing.id }, data: { role: role as any, status: 'APPROVED' } });
      if (role === 'LEADER') await prisma.smallGroup.update({ where: { id: groupId }, data: { leaderUserId: targetUserId } });
      return NextResponse.json(updated);
    }

    const created = await prisma.smallGroupMembership.create({ data: { groupId, userId: targetUserId, role: role as any, status: 'APPROVED', addedByUserId: userId } });
    if (role === 'LEADER') await prisma.smallGroup.update({ where: { id: groupId }, data: { leaderUserId: targetUserId } });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(`Failed to add leader for group ${groupId}:`, error);
    return NextResponse.json({ message: 'Failed to add leader' }, { status: 500 });
  }
}
