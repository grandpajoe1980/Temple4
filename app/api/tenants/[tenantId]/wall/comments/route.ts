import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, unauthorized } from '@/lib/api-response';
import { createRouteLogger } from '@/lib/logger';
import { addComment } from '@/lib/services/profile-post-service';
import { getTenantContext } from '@/lib/tenant-context';

const createCommentSchema = z.object({ postId: z.string().min(1), content: z.string().min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const resolvedParams = await params;
  const logger = createRouteLogger('POST /api/tenants/[tenantId]/wall/comments', { tenantId: resolvedParams.tenantId });

  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) return unauthorized();

    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const { postId, content } = parsed.data;

    // Any signed-in user may comment on wall posts. Comments are stored on the profile post record.
    logger.info('Adding comment', { userId, postId });

    const comment = await addComment(postId, userId, content);

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    return handleApiError(err, { route: 'POST /api/tenants/[tenantId]/wall/comments', tenantId: (await params).tenantId });
  }
}
