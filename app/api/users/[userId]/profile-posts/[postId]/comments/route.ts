import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { addComment } from '@/lib/services/profile-post-service';
import { z } from 'zod';

const AddCommentSchema = z.object({
    content: z.string().min(1).max(1000),
});

/**
 * POST /api/users/[userId]/profile-posts/[postId]/comments
 * Add a comment to a post
 */
export async function POST(
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
        const { content } = AddCommentSchema.parse(body);

        const comment = await addComment(postId, session.user.id, content);

        return NextResponse.json(comment, { status: 201 });
    } catch (error: any) {
        console.error('Error adding comment:', error);

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid comment content', details: error.errors },
                { status: 400 }
            );
        }

        if (error.message.includes('permission')) {
            return NextResponse.json(
                { error: error.message },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to add comment' },
            { status: 500 }
        );
    }
}
