import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/users/search - Search for users with filters
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!session || !currentUserId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const city = searchParams.get('city') || '';
        const minAge = searchParams.get('minAge');
        const maxAge = searchParams.get('maxAge');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
        const offset = parseInt(searchParams.get('offset') || '0');

        // Get current user's friends to exclude from results
        const friendships = await prisma.friendship.findMany({
            where: { userId: currentUserId },
            select: { friendId: true },
        });
        const friendIds = friendships.map(f => f.friendId);

        // Build age filter based on birthDate
        const today = new Date();
        let minBirthDate: Date | undefined;
        let maxBirthDate: Date | undefined;

        if (maxAge) {
            // If maxAge is 30, minBirthDate is 30 years ago from today
            minBirthDate = new Date(today.getFullYear() - parseInt(maxAge) - 1, today.getMonth(), today.getDate());
        }
        if (minAge) {
            // If minAge is 20, maxBirthDate is 20 years ago from today
            maxBirthDate = new Date(today.getFullYear() - parseInt(minAge), today.getMonth(), today.getDate());
        }

        // Search for users
        const users = await prisma.user.findMany({
            where: {
                id: {
                    not: currentUserId,
                    notIn: friendIds,
                },
                OR: query ? [
                    { email: { contains: query, mode: 'insensitive' } },
                    { profile: { displayName: { contains: query, mode: 'insensitive' } } },
                ] : undefined,
                profile: {
                    ...(city ? { locationCity: { contains: city, mode: 'insensitive' } } : {}),
                    ...(minBirthDate || maxBirthDate ? {
                        birthDate: {
                            ...(minBirthDate ? { gte: minBirthDate } : {}),
                            ...(maxBirthDate ? { lte: maxBirthDate } : {}),
                        },
                    } : {}),
                },
            },
            select: {
                id: true,
                email: true,
                profile: {
                    select: {
                        displayName: true,
                        avatarUrl: true,
                        locationCity: true,
                        locationCountry: true,
                        birthDate: true,
                    },
                },
            },
            take: limit,
            skip: offset,
            orderBy: [
                { profile: { displayName: 'asc' } },
                { email: 'asc' },
            ],
        });

        // Get pending friend requests to determine status
        const pendingRequests = await prisma.friendRequest.findMany({
            where: {
                status: 'PENDING',
                OR: [
                    { senderId: currentUserId, receiverId: { in: users.map(u => u.id) } },
                    { receiverId: currentUserId, senderId: { in: users.map(u => u.id) } },
                ],
            },
            select: {
                senderId: true,
                receiverId: true,
            },
        });

        // Map users with friend status
        const usersWithStatus = users.map(user => {
            const sentRequest = pendingRequests.find(
                r => r.senderId === currentUserId && r.receiverId === user.id
            );
            const receivedRequest = pendingRequests.find(
                r => r.receiverId === currentUserId && r.senderId === user.id
            );

            let friendStatus: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS' = 'NONE';
            if (sentRequest) friendStatus = 'PENDING_SENT';
            else if (receivedRequest) friendStatus = 'PENDING_RECEIVED';

            return {
                ...user,
                friendStatus,
            };
        });

        return NextResponse.json({ users: usersWithStatus });
    } catch (error) {
        console.error('Failed to search users:', error);
        return NextResponse.json({ message: 'Failed to search users' }, { status: 500 });
    }
}
