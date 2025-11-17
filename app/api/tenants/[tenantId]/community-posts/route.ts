import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMembershipForUserInTenant } from '@/lib/data';
import { can } from '@/lib/permissions';
import { z } from 'zod';
import { CommunityPostType, CommunityPostStatus } from '@prisma/client';

// 15.1 List Community Posts
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    try {
        const membership = await getMembershipForUserInTenant(userId, params.tenantId);
        if (!membership) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } });
        if (!tenant) {
            return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
        }

        const canView = await can(userId, tenant, 'canManagePrayerWall');
        if (!canView) {
            return NextResponse.json({ message: 'You do not have permission to view the prayer wall.' }, { status: 403 });
        }

        const posts = await prisma.communityPost.findMany({
            where: {
                tenantId: params.tenantId,
                status: 'PUBLISHED',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(posts);
    } catch (error) {
        console.error(`Failed to fetch community posts for tenant ${params.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to fetch community posts' }, { status: 500 });
    }
}

const postSchema = z.object({
    body: z.string().min(1),
    type: z.nativeEnum(CommunityPostType),
    isAnonymous: z.boolean(),
});

// 15.2 Create Community Post
export async function POST(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const result = postSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const membership = await getMembershipForUserInTenant(userId, params.tenantId);
        if (!membership) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } });
        if (!tenant) {
            return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
        }

        const canCreate = await can(userId, tenant, 'canManagePrayerWall');
        if (!canCreate) {
            return NextResponse.json({ message: 'You do not have permission to create a prayer request.' }, { status: 403 });
        }

        const newPost = await prisma.communityPost.create({
            data: {
                tenantId: params.tenantId,
                authorUserId: result.data.isAnonymous ? null : userId,
                ...result.data,
                status: CommunityPostStatus.PENDING, // Or PUBLISHED, depending on tenant settings
            },
        });

        return NextResponse.json(newPost, { status: 201 });
    } catch (error) {
        console.error(`Failed to create community post for tenant ${params.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to create community post' }, { status: 500 });
    }
}
