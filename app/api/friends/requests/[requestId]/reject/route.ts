import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/friends/requests/[requestId]/reject - Reject a friend request
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

        // Only the receiver can reject
        if (friendRequest.receiverId !== currentUserId) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        if (friendRequest.status !== 'PENDING') {
            return NextResponse.json({ message: 'Request already processed' }, { status: 400 });
        }

        // Reject the request
        await prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED', respondedAt: new Date() },
        });

        return NextResponse.json({ message: 'Friend request rejected' });
    } catch (error) {
        console.error(`Failed to reject friend request ${requestId}:`, error);
        return NextResponse.json({ message: 'Failed to reject friend request' }, { status: 500 });
    }
}
