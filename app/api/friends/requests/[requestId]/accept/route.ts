import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/friends/requests/[requestId]/accept - Accept a friend request
export async function POST(
    request: Request,
    { params }: { params: Promise<{ requestId: string }> }
) {
    const { requestId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!session || !currentUserId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Find the request
        const friendRequest = await prisma.friendRequest.findUnique({
            where: { id: requestId },
        });

        if (!friendRequest) {
            return NextResponse.json({ message: 'Friend request not found' }, { status: 404 });
        }

        // Only the receiver can accept
        if (friendRequest.receiverId !== currentUserId) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        if (friendRequest.status !== 'PENDING') {
            return NextResponse.json({ message: 'Request already processed' }, { status: 400 });
        }

        // Accept the request and create bidirectional friendships
        await prisma.$transaction([
            prisma.friendRequest.update({
                where: { id: requestId },
                data: { status: 'ACCEPTED', respondedAt: new Date() },
            }),
            prisma.friendship.create({
                data: { userId: currentUserId, friendId: friendRequest.senderId },
            }),
            prisma.friendship.create({
                data: { userId: friendRequest.senderId, friendId: currentUserId },
            }),
        ]);

        return NextResponse.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error(`Failed to accept friend request ${requestId}:`, error);
        return NextResponse.json({ message: 'Failed to accept friend request' }, { status: 500 });
    }
}
