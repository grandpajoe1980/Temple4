import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { can } from '@/lib/permissions';
import { z } from 'zod';
import { CommunityPostStatus } from '@prisma/client';

const updateStatusSchema = z.object({
    status: z.nativeEnum(CommunityPostStatus),
});

// 15.3 Update Community Post Status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; postId: string }> }
) {
    const { tenantId } = await params;
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
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
        }

        const canUpdate = await can(userId, tenant, 'canManagePrayerWall');
        if (!canUpdate) {
            return NextResponse.json({ message: 'You do not have permission to manage the prayer wall.' }, { status: 403 });
        }

        const updatedPost = await prisma.communityPost.update({
            where: {
                id: params.postId,
                tenantId: tenantId,
            },
            data: {
                status: result.data.status,
            },
        });

        return NextResponse.json(updatedPost);
    } catch (error) {
        console.error(`Failed to update community post ${params.postId}:`, error);
        return NextResponse.json({ message: 'Failed to update community post' }, { status: 500 });
    }
}
