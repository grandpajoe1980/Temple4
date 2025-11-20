import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
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
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const result = updateStatusSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, include: { settings: true } });
        if (!tenant) {
            return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
        }

        if (!tenant.settings?.enablePrayerWall) {
            return NextResponse.json({ message: 'Prayer wall is not enabled for this tenant' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const canUpdate = await can(user, tenant, 'canManagePrayerWall');
        if (!canUpdate) {
            return NextResponse.json({ message: 'You do not have permission to manage the prayer wall.' }, { status: 403 });
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
        return NextResponse.json({ message: 'Failed to update community post' }, { status: 500 });
    }
}

// PATCH - Update Community Post Status (moderation) - same as PUT for consistency
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
    return PUT(request, { params });
}
