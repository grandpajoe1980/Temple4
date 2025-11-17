import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent } from '@/lib/permissions';
import { z } from 'zod';

// 9.3 Get Single Post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, resolvedParams.tenantId, 'posts');
    if (!canView) {
      return NextResponse.json({ message: 'You do not have permission to view this post.' }, { status: 403 });
    }

    const post = await prisma.post.findFirst({
      where: { 
        id: resolvedParams.postId, 
        tenantId: resolvedParams.tenantId 
      },
      include: {
        author: {
          select: {
            id: true,
            profile: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error(`Failed to fetch post ${resolvedParams.postId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch post' }, { status: 500 });
  }
}

const postUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    type: z.enum(['BLOG', 'ANNOUNCEMENT', 'BOOK']).optional(),
});

// 9.4 Update Post
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const result = postUpdateSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const post = await prisma.post.findUnique({ where: { id: resolvedParams.postId } });
        if (!post || post.tenantId !== resolvedParams.tenantId) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        // Check if user is the author or a moderator
        const membership = await prisma.userTenantMembership.findUnique({ 
          where: { userId_tenantId: { userId, tenantId: resolvedParams.tenantId } },
          include: { roles: true }
        });
        const isAuthor = post.authorUserId === userId;
        const canModerate = membership?.roles.some(r => ['ADMIN', 'MODERATOR'].includes(r.role));

        if (!isAuthor && !canModerate) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const updatedPost = await prisma.post.update({
            where: { id: resolvedParams.postId },
            data: result.data,
        });

        return NextResponse.json(updatedPost);
    } catch (error) {
        console.error(`Failed to update post ${resolvedParams.postId}:`, error);
        return NextResponse.json({ message: 'Failed to update post' }, { status: 500 });
    }
}

// 9.5 Delete Post
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const post = await prisma.post.findUnique({ where: { id: resolvedParams.postId } });
        if (!post || post.tenantId !== resolvedParams.tenantId) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        // Check if user is the author or a moderator/admin
        const membership = await prisma.userTenantMembership.findUnique({ 
          where: { userId_tenantId: { userId, tenantId: resolvedParams.tenantId } },
          include: { roles: true }
        });
        const isAuthor = post.authorUserId === userId;
        const canModerate = membership?.roles.some(r => ['ADMIN', 'MODERATOR'].includes(r.role));

        if (!isAuthor && !canModerate) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        await prisma.post.delete({
            where: { id: resolvedParams.postId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete post ${resolvedParams.postId}:`, error);
        return NextResponse.json({ message: 'Failed to delete post' }, { status: 500 });
    }
}
