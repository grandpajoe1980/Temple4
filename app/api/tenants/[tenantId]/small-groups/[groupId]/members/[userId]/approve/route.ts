import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isGroupLeader } from '@/lib/permissions';
import { approveSmallGroupMember } from '@/lib/data';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string; userId: string }> }
) {
  const { tenantId, groupId, userId: targetUserId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  try {
    const allowed = await isGroupLeader(userId, groupId);
    if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const updated = await approveSmallGroupMember(groupId, targetUserId, userId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error(`Failed to approve member ${targetUserId} for group ${groupId}:`, error);
    return NextResponse.json({ message: 'Failed to approve member' }, { status: 500 });
  }
}
