import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, unauthorized } from '@/lib/api-response';
import { createRouteLogger } from '@/lib/logger';
import { hideProfilePost } from '@/lib/services/profile-post-service';

const hideSchema = z.object({ postId: z.string().min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const resolvedParams = await params;
  const logger = createRouteLogger('POST /api/tenants/[tenantId]/wall/hide', { tenantId: resolvedParams.tenantId });

  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) return unauthorized();

    const body = await request.json();
    const parsed = hideSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

    const { postId } = parsed.data;

    logger.info('Hiding post', { userId, postId });

    await hideProfilePost(postId, userId, resolvedParams.tenantId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, { route: 'POST /api/tenants/[tenantId]/wall/hide', tenantId: (await params).tenantId });
  }
}
