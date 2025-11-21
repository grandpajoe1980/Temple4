import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isGroupLeader } from '@/lib/permissions';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string; userId: string }> }
) {
  const { tenantId, groupId, userId: targetUserId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  try {
    const requesterIsLeader = await isGroupLeader(userId, groupId);
    if (!requesterIsLeader && userId !== targetUserId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const membership = await prisma.smallGroupMembership.findUnique({ where: { groupId_userId: { groupId, userId: targetUserId } } });
    if (!membership) return NextResponse.json({ message: 'Membership not found' }, { status: 404 });

    await prisma.smallGroupMembership.delete({ where: { id: membership.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to remove member ${targetUserId} from group ${groupId}:`, error);
    return NextResponse.json({ message: 'Failed to remove member' }, { status: 500 });
  }
}
