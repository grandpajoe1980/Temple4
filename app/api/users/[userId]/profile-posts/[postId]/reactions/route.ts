import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { addReaction, removeReaction } from '@/lib/services/profile-post-service';
import { z } from 'zod';

const AddReactionSchema = z.object({
    type: z.enum(['LIKE', 'LOVE', 'LAUGH', 'WOW', 'SAD', 'ANGRY']),
});

/**
 * POST /api/users/[userId]/profile-posts/[postId]/reactions
 * Add or update a reaction to a post
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
        const { type } = AddReactionSchema.parse(body);

        await addReaction(postId, session.user.id, type);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error adding reaction:', error);

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid reaction type', details: error.errors },
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
            { error: 'Failed to add reaction' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/users/[userId]/profile-posts/[postId]/reactions
 * Remove a reaction from a post
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

        await removeReaction(postId, session.user.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error removing reaction:', error);
        return NextResponse.json(
            { error: 'Failed to remove reaction' },
            { status: 500 }
        );
    }
}
