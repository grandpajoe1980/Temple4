import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-response';
import { createRouteLogger } from '@/lib/logger';
import { listTenantProfilePosts } from '@/lib/services/profile-post-service';

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const resolvedParams = await params;
  const logger = createRouteLogger('GET /api/tenants/[tenantId]/wall', { tenantId: resolvedParams.tenantId });

  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id ?? null;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    logger.info('Listing tenant wall posts', { userId, page, limit });

    const { posts, totalCount } = await listTenantProfilePosts(resolvedParams.tenantId, userId, { page, limit });

    return NextResponse.json({ posts, totalCount });
  } catch (err) {
    return handleApiError(err, { route: 'GET /api/tenants/[tenantId]/wall', tenantId: (await params).tenantId });
  }
}
