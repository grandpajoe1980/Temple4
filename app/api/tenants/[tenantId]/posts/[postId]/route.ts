import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { TenantRole } from '@prisma/client';
import { prisma } from '@/lib/db';
import { canUserViewContent } from '@/lib/permissions';
import { z } from 'zod';

// 9.3 Get Single Post
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string; postId: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, params.tenantId, 'posts');
    if (!canView) {
      return NextResponse.json({ message: 'You do not have permission to view this post.' }, { status: 403 });
    }

    const post = await prisma.post.findUnique({
      where: { id: params.postId, tenantId: params.tenantId },
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
    console.error(`Failed to fetch post ${params.postId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch post' }, { status: 500 });
  }
}

const postUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    isPinned: z.boolean().optional(),
});

// 9.4 Update Post
export async function PUT(
  request: Request,
  { params }: { params: { tenantId: string; postId: string } }
) {
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
        const post = await prisma.post.findUnique({ where: { id: params.postId } });
        if (!post || post.tenantId !== params.tenantId) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        // Check if user is the author or a moderator
        const membership = await prisma.userTenantMembership.findUnique({
            where: { userId_tenantId: { userId, tenantId: params.tenantId } },
            include: { roles: true },
        });
        const isAuthor = post.authorUserId === userId;
        const canModerate = membership?.roles.some(role =>
            (role.role === TenantRole.ADMIN || role.role === TenantRole.MODERATOR)
        );

        if (!isAuthor && !canModerate) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const updatedPost = await prisma.post.update({
            where: { id: params.postId },
            data: result.data,
        });

        return NextResponse.json(updatedPost);
    } catch (error) {
        console.error(`Failed to update post ${params.postId}:`, error);
        return NextResponse.json({ message: 'Failed to update post' }, { status: 500 });
    }
}

// 9.5 Delete Post
export async function DELETE(
  request: Request,
  { params }: { params: { tenantId: string; postId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const post = await prisma.post.findUnique({ where: { id: params.postId } });
        if (!post || post.tenantId !== params.tenantId) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        // Check if user is the author or a moderator/admin
        const membership = await prisma.userTenantMembership.findUnique({
            where: { userId_tenantId: { userId, tenantId: params.tenantId } },
            include: { roles: true },
        });
        const isAuthor = post.authorUserId === userId;
        const canModerate = membership?.roles.some(role =>
            (role.role === TenantRole.ADMIN || role.role === TenantRole.MODERATOR)
        );

        if (!isAuthor && !canModerate) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        await prisma.post.delete({
            where: { id: params.postId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete post ${params.postId}:`, error);
        return NextResponse.json({ message: 'Failed to delete post' }, { status: 500 });
    }
}
