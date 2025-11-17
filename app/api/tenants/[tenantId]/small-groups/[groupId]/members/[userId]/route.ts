import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 14.8 Remove Group Member
export async function DELETE(
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
        const group = await prisma.smallGroup.findUnique({
            where: { id: groupId },
            include: { members: true }
        });

        if (!group) {
            return NextResponse.json({ message: 'Group not found' }, { status: 404 });
        }

        const isLeader = group.members.some((m: any) => m.userId === currentUserId && m.role === 'LEADER');
        const isSelf = currentUserId === userId;

        // A user can leave a group, or a leader can remove them.
        if (!isLeader && !isSelf) {
            return NextResponse.json({ message: 'You can only remove yourself from the group.' }, { status: 403 });
        }

        await prisma.smallGroupMember.delete({
            where: {
                userId_smallGroupId: {
                    userId: userId,
                    smallGroupId: groupId,
                }
            }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to remove member from group ${groupId}:`, error);
        return NextResponse.json({ message: 'Failed to remove member' }, { status: 500 });
    }
}
