import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { handleApiError, unauthorized, forbidden, notFound, validationError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { can } from '@/lib/permissions';
import { z } from 'zod';
import { CommunityPostStatus } from '@/types';

const updateStatusSchema = z.object({
    status: z.nativeEnum(CommunityPostStatus),
});

// 15.3 Update Community Post Status (PUT - existing functionality)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
    const { postId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return unauthorized();
    }

    const result = updateStatusSchema.safeParse(await request.json());
    if (!result.success) {
        return validationError(result.error.flatten().fieldErrors);
    }

    try {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, include: { settings: true } });
        if (!tenant) {
            return notFound('Tenant');
        }

        if (!tenant.settings?.enablePrayerWall) {
            return forbidden('Prayer wall is not enabled for this tenant');
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return notFound('User');
        }

        const canUpdate = await can(user, tenant, 'canManagePrayerWall');
        if (!canUpdate) {
            return forbidden('You do not have permission to manage the prayer wall.');
        }

        const updatedPost = await prisma.communityPost.update({
            where: {
                id: postId,
                tenantId: tenantId,
            },
            data: {
                status: result.data.status,
            },
        });

        return NextResponse.json(updatedPost);
    } catch (error) {
        console.error(`Failed to update community post ${postId}:`, error);
        return handleApiError(error, { route: 'PUT /api/tenants/[tenantId]/community-posts/[postId]', tenantId, postId });
    }
}

// PATCH - Update Community Post Status (moderation) - same as PUT for consistency
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
    return PUT(request, { params });
}
