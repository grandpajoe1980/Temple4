import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, forbidden, unauthorized, validationError } from '@/lib/api-response';
import { createRouteLogger } from '@/lib/logger';
import { createTenantPost, listTenantPosts, PostPermissionError } from '@/lib/services/post-service';

// 9.1 List Posts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  const logger = createRouteLogger('GET /api/tenants/[tenantId]/posts', { 
    tenantId: resolvedParams.tenantId 
  });
  
  let userId: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    userId = (session?.user as any)?.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    logger.info('Fetching posts', { userId, page, limit });

    const { posts, pagination } = await listTenantPosts({
      tenantId: resolvedParams.tenantId,
      viewerUserId: userId ?? null,
      page,
      limit,
      publishedOnly: true,
    });

    logger.info('Posts fetched successfully', { count: posts.length, totalResults: pagination.totalResults });

    return NextResponse.json({
      posts,
      pagination,
    });
  } catch (error) {
    if (error instanceof PostPermissionError) {
      logger.warn('Permission denied', { userId });
      return forbidden(error.message);
    }

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

  let userId: string | undefined;
  let requestBody: unknown;
  try {
    const session = await getServerSession(authOptions);
    userId = (session?.user as any)?.id;

    if (!userId) {
      logger.warn('Unauthenticated request');
      return unauthorized();
    }

    requestBody = await request.json();
    const result = postCreateSchema.safeParse(requestBody);
    if (!result.success) {
      logger.warn('Validation failed', { userId, errors: result.error.issues });
      return validationError(result.error.flatten().fieldErrors);
    }

    const { title, body, type } = result.data;

    const newPost = await createTenantPost({
      tenantId: resolvedParams.tenantId,
      authorUserId: userId,
      data: {
        title,
        body,
        type: (type as any) || 'BLOG',
        isPublished: true,
      },
    });

    logger.info('Post created successfully', { userId, postId: newPost.id, type: newPost.type });

    // TODO: Trigger notifications for announcements
    // if (type === 'ANNOUNCEMENT') { ... }

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    if (error instanceof PostPermissionError) {
      logger.warn('Permission denied', { userId, type: (requestBody as any)?.type });
      return forbidden(error.message);
    }

    return handleApiError(error, {
      route: 'POST /api/tenants/[tenantId]/posts',
      tenantId: resolvedParams.tenantId
    });
  }
}
