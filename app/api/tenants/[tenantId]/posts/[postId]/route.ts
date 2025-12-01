import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { handleApiError, unauthorized, forbidden, notFound, validationError } from '@/lib/api-response';
import { TenantRole } from '@/types';
import { prisma } from '@/lib/db';
import { canUserViewContent } from '@/lib/permissions';
import { z } from 'zod';

// 9.3 Get Single Post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
    const { postId, tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, tenantId, 'posts');
    if (!canView) {
      return forbidden('You do not have permission to view this post.');
    }

    const post = await prisma.post.findUnique({
      where: { id: postId, tenantId: tenantId },
      include: {
        author: {
          select: {
            id: true,
            profile: true,
          },
        },
      },
    });

    if (!post || post.deletedAt) {
      return notFound('Post not found');
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error(`Failed to fetch post ${postId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/posts/[postId]', tenantId, postId, userId });
  }
}

const postUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    isPublished: z.boolean().optional(),
});

// 9.4 Update Post
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
    const { postId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return unauthorized();
    }

    const result = postUpdateSchema.safeParse(await request.json());
    if (!result.success) {
      return validationError(result.error.flatten().fieldErrors);
    }

    try {
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post || post.tenantId !== tenantId || post.deletedAt) {
          return notFound('Post not found');
        }

        // Check if user is the author or a moderator (platform super-admins bypass)
        const membership = await prisma.userTenantMembership.findUnique({
            where: { userId_tenantId: { userId, tenantId: tenantId } },
            include: { roles: true },
        });
        const isPlatformAdmin = Boolean((session?.user as any)?.isSuperAdmin);
        const isAuthor = post.authorUserId === userId;
        const canModerate = membership?.roles.some((role: any) =>
            (role.role === TenantRole.ADMIN || role.role === TenantRole.MODERATOR)
        );
        if (!isAuthor && !canModerate && !isPlatformAdmin) {
          return forbidden('Forbidden');
        }

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: result.data,
        });

        return NextResponse.json(updatedPost);
    } catch (error) {
      console.error(`Failed to update post ${postId}:`, error);
      return handleApiError(error, { route: 'PATCH /api/tenants/[tenantId]/posts/[postId]', tenantId, postId, userId });
    }
}

// 9.5 Delete Post (Soft Delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
    const { postId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return unauthorized();
    }

    try {
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post || post.tenantId !== tenantId || post.deletedAt) {
          return notFound('Post not found');
        }

        // Check if user is the author or a moderator/admin
        const membership = await prisma.userTenantMembership.findUnique({
            where: { userId_tenantId: { userId, tenantId: tenantId } },
            include: { roles: true },
        });
        const isPlatformAdmin = Boolean((session?.user as any)?.isSuperAdmin);
        const isAuthor = post.authorUserId === userId;
        const canModerate = membership?.roles.some((role: any) =>
            (role.role === TenantRole.ADMIN || role.role === TenantRole.MODERATOR)
        );

        if (!isAuthor && !canModerate && !isPlatformAdmin) {
          return forbidden('Forbidden');
        }

        // Soft delete by setting deletedAt timestamp
        await prisma.post.update({
            where: { id: postId },
            data: { deletedAt: new Date() },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error(`Failed to delete post ${postId}:`, error);
      return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/posts/[postId]', tenantId, postId, userId });
    }
}
