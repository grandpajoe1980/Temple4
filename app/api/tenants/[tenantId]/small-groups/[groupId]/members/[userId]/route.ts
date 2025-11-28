import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { handleApiError, unauthorized, forbidden, notFound } from '@/lib/api-response';
import { prisma } from '@/lib/db';

// 14.8 Remove Group Member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string; userId: string }> }
) {
    const { groupId, tenantId, userId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!currentUserId) {
        return unauthorized();
    }

    try {
        const group = await prisma.smallGroup.findUnique({
            where: { id: groupId },
            include: { members: true }
        });

        if (!group) {
            return notFound('Group');
        }

        const isLeader = group.members.some((m: any) => m.userId === currentUserId && m.role === 'LEADER');
        const isSelf = currentUserId === userId;

        // A user can leave a group, or a leader can remove them.
        if (!isLeader && !isSelf) {
            return forbidden('You can only remove yourself from the group.');
        }

        await prisma.smallGroupMembership.delete({
            where: {
                groupId_userId: {
                    groupId: groupId,
                    userId: userId,
                }
            }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to remove member from group ${groupId}:`, error);
        return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/small-groups/[groupId]/members/[userId]', tenantId, groupId, userId });
    }
}
