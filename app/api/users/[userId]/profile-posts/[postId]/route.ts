import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
    getProfilePost,
    updateProfilePost,
    deleteProfilePost
} from '@/lib/services/profile-post-service';
import { z } from 'zod';

const UpdatePostSchema = z.object({
    content: z.string().optional(),
    linkUrl: z.string().url().optional(),
    linkTitle: z.string().optional(),
    linkImage: z.string().url().optional(),
    privacy: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']).optional(),
});

/**
 * GET /api/users/[userId]/profile-posts/[postId]
 * Get a single profile post
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string; postId: string }> }
) {
    try {
        const { postId } = await params;
        const session = await getServerSession(authOptions);
        const viewerId = session?.user?.id || null;

        const post = await getProfilePost(postId, viewerId);

        return NextResponse.json(post);
    } catch (error: any) {
        console.error('Error fetching profile post:', error);

        if (error.message.includes('permission')) {
            return NextResponse.json(
                { error: error.message },
                { status: 403 }
            );
        }

        if (error.message.includes('not found')) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch profile post' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/users/[userId]/profile-posts/[postId]
 * Update a profile post (owner only)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string; postId: string }> }
) {
    try {
        const { postId } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = UpdatePostSchema.parse(body);

        const post = await updateProfilePost(postId, session.user.id, validatedData);

        return NextResponse.json(post);
    } catch (error: any) {
        console.error('Error updating profile post:', error);

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }

        if (error.message.includes('permission') || error.message.includes('only')) {
            return NextResponse.json(
                { error: error.message },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update profile post' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/users/[userId]/profile-posts/[postId]
 * Delete a profile post (owner only)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string; postId: string }> }
) {
    try {
        const { postId } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await deleteProfilePost(postId, session.user.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting profile post:', error);

        if (error.message.includes('permission') || error.message.includes('only')) {
            return NextResponse.json(
                { error: error.message },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to delete profile post' },
            { status: 500 }
        );
    }
}
