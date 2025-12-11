import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/friends/feed - Get friends' wall posts (FRIENDS privacy only)
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!session || !currentUserId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    try {
        // Get list of friend IDs
        const friendships = await prisma.friendship.findMany({
            where: { userId: currentUserId },
            select: { friendId: true },
        });

        const friendIds = friendships.map((f) => f.friendId);

        if (friendIds.length === 0) {
            return NextResponse.json({ posts: [], totalCount: 0, page, limit });
        }

        // Get posts from friends with FRIENDS privacy
        const [posts, totalCount] = await Promise.all([
            prisma.profilePost.findMany({
                where: {
                    userId: { in: friendIds },
                    privacy: 'FRIENDS',
                    deletedAt: null,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            profile: {
                                select: { displayName: true, avatarUrl: true },
                            },
                        },
                    },
                    media: {
                        orderBy: { order: 'asc' },
                    },
                    reactions: {
                        select: { userId: true, type: true },
                    },
                    friendComments: {
                        where: { deletedAt: null },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    profile: {
                                        select: { displayName: true, avatarUrl: true },
                                    },
                                },
                            },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.profilePost.count({
                where: {
                    userId: { in: friendIds },
                    privacy: 'FRIENDS',
                    deletedAt: null,
                },
            }),
        ]);

        // Transform posts to include computed fields
        const transformedPosts = posts.map((post) => {
            // Count reactions by type
            const reactionCounts: Record<string, number> = {
                LIKE: 0,
                LOVE: 0,
                LAUGH: 0,
                WOW: 0,
                SAD: 0,
                ANGRY: 0,
            };
            post.reactions.forEach((r) => {
                reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
            });

            // Get user's reaction if any
            const userReaction = post.reactions.find((r) => r.userId === currentUserId)?.type || null;

            return {
                id: post.id,
                userId: post.userId,
                type: post.type,
                content: post.content,
                linkUrl: post.linkUrl,
                linkTitle: post.linkTitle,
                linkImage: post.linkImage,
                privacy: post.privacy,
                createdAt: post.createdAt.toISOString(),
                updatedAt: post.updatedAt.toISOString(),
                authorDisplayName: post.user.profile?.displayName || 'Unknown',
                authorAvatarUrl: post.user.profile?.avatarUrl,
                media: post.media,
                reactionCounts,
                userReaction,
                comments: post.friendComments.map((c) => ({
                    id: c.id,
                    userId: c.userId,
                    content: c.content,
                    createdAt: c.createdAt.toISOString(),
                    authorDisplayName: c.user.profile?.displayName || 'Unknown',
                    authorAvatarUrl: c.user.profile?.avatarUrl,
                })),
                commentCount: post.friendComments.length,
            };
        });

        return NextResponse.json({
            posts: transformedPosts,
            totalCount,
            page,
            limit,
        });
    } catch (error) {
        console.error('Failed to fetch friends feed:', error);
        return NextResponse.json({ message: 'Failed to fetch friends feed' }, { status: 500 });
    }
}
