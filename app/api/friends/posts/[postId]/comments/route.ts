import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/friends/posts/[postId]/comments - Get comments for a post on friends feed
export async function GET(
    request: Request,
    { params }: { params: Promise<{ postId: string }> }
) {
    const { postId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!session || !currentUserId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Check if the post exists and user is friend of author
        const post = await prisma.profilePost.findUnique({
            where: { id: postId },
            select: { userId: true, privacy: true },
        });

        if (!post) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        // Check if user is friend of post author (or is the author)
        if (post.userId !== currentUserId) {
            const friendship = await prisma.friendship.findFirst({
                where: { userId: currentUserId, friendId: post.userId },
            });

            if (!friendship) {
                return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
            }
        }

        const comments = await prisma.friendPostComment.findMany({
            where: { postId, deletedAt: null },
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
        });

        return NextResponse.json({
            comments: comments.map((c) => ({
                id: c.id,
                userId: c.userId,
                content: c.content,
                createdAt: c.createdAt.toISOString(),
                authorDisplayName: c.user.profile?.displayName || 'Unknown',
                authorAvatarUrl: c.user.profile?.avatarUrl,
            })),
        });
    } catch (error) {
        console.error(`Failed to fetch comments for post ${postId}:`, error);
        return NextResponse.json({ message: 'Failed to fetch comments' }, { status: 500 });
    }
}

// POST /api/friends/posts/[postId]/comments - Add a comment to a post on friends feed
export async function POST(
    request: Request,
    { params }: { params: Promise<{ postId: string }> }
) {
    const { postId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!session || !currentUserId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { content } = await request.json();

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ message: 'Content is required' }, { status: 400 });
        }

        // Check if the post exists
        const post = await prisma.profilePost.findUnique({
            where: { id: postId },
            select: { userId: true, privacy: true },
        });

        if (!post) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        // Check if user is friend of post author (or is the author)
        if (post.userId !== currentUserId) {
            const friendship = await prisma.friendship.findFirst({
                where: { userId: currentUserId, friendId: post.userId },
            });

            if (!friendship) {
                return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
            }
        }

        // Create the comment
        const comment = await prisma.friendPostComment.create({
            data: {
                postId,
                userId: currentUserId,
                content: content.trim(),
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
            },
        });

        return NextResponse.json({
            id: comment.id,
            userId: comment.userId,
            content: comment.content,
            createdAt: comment.createdAt.toISOString(),
            authorDisplayName: comment.user.profile?.displayName || 'Unknown',
            authorAvatarUrl: comment.user.profile?.avatarUrl,
        }, { status: 201 });
    } catch (error) {
        console.error(`Failed to add comment to post ${postId}:`, error);
        return NextResponse.json({ message: 'Failed to add comment' }, { status: 500 });
    }
}
