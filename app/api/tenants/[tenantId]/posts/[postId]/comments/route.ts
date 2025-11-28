import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { canUserViewContent } from '@/lib/permissions';
import { forbidden, handleApiError, unauthorized, notFound, validationError } from '@/lib/api-response';

const commentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty'),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
  const { tenantId, postId } = await params;
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const canView = await canUserViewContent(userId, tenantId, 'posts');
    if (!canView) {
      return forbidden('You do not have permission to view comments for this post.');
    }

    const post = await prisma.post.findFirst({
      where: { id: postId, tenantId, deletedAt: null },
    });

    if (!post) {
      return notFound('Post not found');
    }

    const comments = await prisma.postComment.findMany({
      where: { postId, tenantId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });

    return NextResponse.json(
      comments.map((comment) => ({
        ...comment,
        authorDisplayName: comment.author.profile?.displayName || comment.author.email,
        authorAvatarUrl: comment.author.profile?.avatarUrl || undefined,
      }))
    );
  } catch (error) {
    return handleApiError(error, {
      route: 'GET /api/tenants/[tenantId]/posts/[postId]/comments',
      tenantId,
      postId,
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
  const { tenantId, postId } = await params;

  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return unauthorized();
    }

    const canView = await canUserViewContent(userId, tenantId, 'posts');
    if (!canView) {
      return forbidden('You do not have permission to interact with this post.');
    }

    const membership = await prisma.userTenantMembership.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });

    if (!membership || membership.status !== 'APPROVED') {
      return forbidden('Only approved members can comment on posts.');
    }

    const post = await prisma.post.findFirst({
      where: { id: postId, tenantId, deletedAt: null },
    });

    if (!post) {
      return notFound('Post not found');
    }

    const result = commentSchema.safeParse(await request.json());
    if (!result.success) {
      return validationError(result.error.flatten().fieldErrors);
    }

    const newComment = await prisma.postComment.create({
      data: {
        tenantId,
        postId,
        authorUserId: userId,
        body: result.data.body,
      },
      include: {
        author: { include: { profile: true } },
      },
    });

    return NextResponse.json(
      {
        ...newComment,
        authorDisplayName: newComment.author.profile?.displayName || newComment.author.email,
        authorAvatarUrl: newComment.author.profile?.avatarUrl || undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, {
      route: 'POST /api/tenants/[tenantId]/posts/[postId]/comments',
      tenantId,
      postId,
    });
  }
}
