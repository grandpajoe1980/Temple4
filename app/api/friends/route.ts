import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/friends - Get list of friends for current user
export async function GET() {
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!session || !currentUserId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const friendships = await prisma.friendship.findMany({
            where: { userId: currentUserId },
            include: {
                friend: {
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: {
                                displayName: true,
                                avatarUrl: true,
                                bio: true,
                                locationCity: true,
                                locationCountry: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const friends = friendships.map((f) => ({
            friendshipId: f.id,
            friendId: f.friendId,
            createdAt: f.createdAt,
            ...f.friend,
        }));

        return NextResponse.json({ friends });
    } catch (error) {
        console.error('Failed to fetch friends:', error);
        return NextResponse.json({ message: 'Failed to fetch friends' }, { status: 500 });
    }
}
