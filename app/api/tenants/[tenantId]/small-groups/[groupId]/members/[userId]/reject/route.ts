import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hasRole, isGroupLeader } from '@/lib/permissions';
import { TenantRole } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string; userId: string }> }
) {
  const { tenantId, groupId, userId } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id;

  if (!currentUserId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const membership = await prisma.smallGroupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) {
      return NextResponse.json({ message: 'Membership not found' }, { status: 404 });
    }

    const userRecord = await prisma.user.findUnique({ where: { id: currentUserId } });
    const isSuperAdmin = !!userRecord?.isSuperAdmin;
    const isTenantAdmin = await hasRole(currentUserId, tenantId, [TenantRole.ADMIN]);
    const leader = await isGroupLeader(currentUserId, groupId);

    if (!leader && !isTenantAdmin && !isSuperAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await prisma.smallGroupMembership.update({
      where: { id: membership.id },
      data: { status: 'REJECTED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to reject member ${userId} for group ${groupId}:`, error);
    return NextResponse.json({ message: 'Failed to reject member' }, { status: 500 });
  }
}
