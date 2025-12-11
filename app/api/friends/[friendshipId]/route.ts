import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// DELETE /api/friends/[friendshipId] - Remove a friend
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ friendshipId: string }> }
) {
    const { friendshipId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!session || !currentUserId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Find the friendship
        const friendship = await prisma.friendship.findUnique({
            where: { id: friendshipId },
        });

        if (!friendship) {
            return NextResponse.json({ message: 'Friendship not found' }, { status: 404 });
        }

        // Only the user who owns this friendship record can delete
        if (friendship.userId !== currentUserId) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        // Delete both direction friendships
        await prisma.friendship.deleteMany({
            where: {
                OR: [
                    { userId: friendship.userId, friendId: friendship.friendId },
                    { userId: friendship.friendId, friendId: friendship.userId },
                ],
            },
        });

        return NextResponse.json({ message: 'Friend removed' });
    } catch (error) {
        console.error(`Failed to remove friend ${friendshipId}:`, error);
        return NextResponse.json({ message: 'Failed to remove friend' }, { status: 500 });
    }
}
