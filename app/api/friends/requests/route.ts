import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/friends/requests - Get pending friend requests for current user
export async function GET() {
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!session || !currentUserId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const requests = await prisma.friendRequest.findMany({
            where: {
                receiverId: currentUserId,
                status: 'PENDING',
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: {
                                displayName: true,
                                avatarUrl: true,
                                locationCity: true,
                                locationCountry: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ requests });
    } catch (error) {
        console.error('Failed to fetch friend requests:', error);
        return NextResponse.json({ message: 'Failed to fetch friend requests' }, { status: 500 });
    }
}
