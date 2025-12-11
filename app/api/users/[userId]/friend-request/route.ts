import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/users/[userId]/friend-request - Send a friend request
export async function POST(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId: targetUserId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!session || !currentUserId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Can't send friend request to yourself
    if (currentUserId === targetUserId) {
        return NextResponse.json({ message: 'Cannot send friend request to yourself' }, { status: 400 });
    }

    try {
        // Check if target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
        });

        if (!targetUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Check if already friends
        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: currentUserId, friendId: targetUserId },
                    { userId: targetUserId, friendId: currentUserId },
                ],
            },
        });

        if (existingFriendship) {
            return NextResponse.json({ message: 'Already friends' }, { status: 409 });
        }

        // Check if there's already a pending request in either direction
        const existingRequest = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: targetUserId, status: 'PENDING' },
                    { senderId: targetUserId, receiverId: currentUserId, status: 'PENDING' },
                ],
            },
        });

        if (existingRequest) {
            // If the target user already sent us a request, accept it instead
            if (existingRequest.senderId === targetUserId) {
                // Accept the existing request - create friendships
                await prisma.$transaction([
                    prisma.friendRequest.update({
                        where: { id: existingRequest.id },
                        data: { status: 'ACCEPTED', respondedAt: new Date() },
                    }),
                    prisma.friendship.create({
                        data: { userId: currentUserId, friendId: targetUserId },
                    }),
                    prisma.friendship.create({
                        data: { userId: targetUserId, friendId: currentUserId },
                    }),
                ]);

                return NextResponse.json({
                    message: 'Friend request accepted - you are now friends',
                    status: 'ACCEPTED'
                }, { status: 200 });
            }

            return NextResponse.json({ message: 'Friend request already pending' }, { status: 409 });
        }

        // Create new friend request
        const friendRequest = await prisma.friendRequest.create({
            data: {
                senderId: currentUserId,
                receiverId: targetUserId,
                status: 'PENDING',
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        profile: {
                            select: { displayName: true, avatarUrl: true },
                        },
                    },
                },
            },
        });

        return NextResponse.json(friendRequest, { status: 201 });
    } catch (error) {
        console.error(`Failed to send friend request to ${targetUserId}:`, error);
        return NextResponse.json({ message: 'Failed to send friend request' }, { status: 500 });
    }
}

// GET /api/users/[userId]/friend-request - Get friend request status with a user
export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId: targetUserId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!session || !currentUserId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Check if already friends
        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: currentUserId, friendId: targetUserId },
                    { userId: targetUserId, friendId: currentUserId },
                ],
            },
        });

        if (friendship) {
            return NextResponse.json({
                status: 'FRIENDS',
                friendshipId: friendship.id
            });
        }

        // Check for pending requests
        const request = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: targetUserId },
                    { senderId: targetUserId, receiverId: currentUserId },
                ],
                status: 'PENDING',
            },
        });

        if (request) {
            return NextResponse.json({
                status: request.senderId === currentUserId ? 'PENDING_SENT' : 'PENDING_RECEIVED',
                requestId: request.id,
            });
        }

        return NextResponse.json({ status: 'NONE' });
    } catch (error) {
        console.error(`Failed to get friend status for ${targetUserId}:`, error);
        return NextResponse.json({ message: 'Failed to get friend status' }, { status: 500 });
    }
}
