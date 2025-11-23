import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createProfilePost, getProfilePosts } from '@/lib/services/profile-post-service';
import { z } from 'zod';

const CreatePostSchema = z.object({
    type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'LINK', 'MIXED']),
    content: z.string().optional(),
    linkUrl: z.string().url().optional(),
    linkTitle: z.string().optional(),
    linkImage: z.string().url().optional(),
    privacy: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']),
    mediaIds: z.array(z.string()).optional(),
});

/**
 * GET /api/users/[userId]/profile-posts
 * List profile posts for a user
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const session = await getServerSession(authOptions);
        const viewerId = session?.user?.id || null;

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const result = await getProfilePosts(userId, viewerId, { page, limit });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error fetching profile posts:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch profile posts' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/users/[userId]/profile-posts
 * Create a new profile post
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Users can only create posts on their own profile
        if (session.user.id !== userId) {
            return NextResponse.json(
                { error: 'You can only create posts on your own profile' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validatedData = CreatePostSchema.parse(body);

        const post = await createProfilePost(userId, validatedData);

        return NextResponse.json(post, { status: 201 });
    } catch (error: any) {
        console.error('Error creating profile post:', error);

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to create profile post' },
            { status: 500 }
        );
    }
}
