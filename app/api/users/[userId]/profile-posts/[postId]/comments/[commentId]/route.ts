import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deleteComment } from '@/lib/services/profile-post-service';

/**
 * DELETE /api/users/[userId]/profile-posts/[postId]/comments/[commentId]
 * Delete a comment (owner only)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string; postId: string; commentId: string }> }
) {
    try {
        const { commentId } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await deleteComment(commentId, session.user.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting comment:', error);

        if (error.message.includes('permission') || error.message.includes('only')) {
            return NextResponse.json(
                { error: error.message },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to delete comment' },
            { status: 500 }
        );
    }
}
