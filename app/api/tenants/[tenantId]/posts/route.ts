import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserPost, canUserViewContent } from '@/lib/permissions';
import { z } from 'zod';
import { handleApiError, forbidden, unauthorized } from '@/lib/api-response';
import { createRouteLogger } from '@/lib/logger';
import { withTenantScope } from '@/lib/tenant-isolation';

// 9.1 List Posts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  const logger = createRouteLogger('GET /api/tenants/[tenantId]/posts', { 
    tenantId: resolvedParams.tenantId 
  });
  
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    logger.info('Fetching posts', { userId, page, limit });

    const canView = await canUserViewContent(userId, resolvedParams.tenantId, 'posts');
    if (!canView) {
      logger.warn('Permission denied', { userId });
      return forbidden('You do not have permission to view posts.');
    }

    // Use tenant isolation helper to ensure tenantId is always included
    const whereClause = withTenantScope(
      { deletedAt: null },
      resolvedParams.tenantId,
      'Post'
    );

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            profile: true,
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const totalPosts = await prisma.post.count({ where: whereClause });

    logger.info('Posts fetched successfully', { count: posts.length, totalPosts });

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalPosts / limit),
        totalResults: totalPosts,
      }
    });
  } catch (error) {
    return handleApiError(error, { 
      route: 'GET /api/tenants/[tenantId]/posts',
      tenantId: resolvedParams.tenantId 
    });
  }
}

const postCreateSchema = z.object({
    title: z.string().min(1, "Title is required"),
    body: z.string().min(1, "Content is required"),
    type: z.string().optional(),
});

// 9.2 Create Post
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  const logger = createRouteLogger('POST /api/tenants/[tenantId]/posts', { 
    tenantId: resolvedParams.tenantId 
  });

  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      logger.warn('Unauthenticated request');
      return unauthorized();
    }

    const result = postCreateSchema.safeParse(await request.json());
    if (!result.success) {
      logger.warn('Validation failed', { userId, errors: result.error.issues });
      return handleApiError(result.error, { 
        route: 'POST /api/tenants/[tenantId]/posts',
        tenantId: resolvedParams.tenantId,
        userId 
      });
    }

    const { title, body, type } = result.data;

    const isAnnouncement = type === 'ANNOUNCEMENT';
    const canPost = await canUserPost(userId, resolvedParams.tenantId, isAnnouncement);
    if (!canPost) {
      logger.warn('Permission denied', { userId, type });
      return forbidden('You do not have permission to create this type of post.');
    }

    const newPost = await prisma.post.create({
      data: {
        title,
        body,
        type: type || 'BLOG',
        tenantId: resolvedParams.tenantId,
        authorUserId: userId,
        isPublished: true,
      },
    });

    logger.info('Post created successfully', { userId, postId: newPost.id, type: newPost.type });

    // TODO: Trigger notifications for announcements
    // if (type === 'ANNOUNCEMENT') { ... }

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    return handleApiError(error, { 
      route: 'POST /api/tenants/[tenantId]/posts',
      tenantId: resolvedParams.tenantId 
    });
  }
}
