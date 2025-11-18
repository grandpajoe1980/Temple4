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
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Allow authenticated users to view - membership check removed
        // Members get full view, non-members might get limited view based on tenant settings
        const tenant = await prisma.tenant.findUnique({ 
            where: { id: resolvedParams.tenantId },
            include: { settings: true }
        });
        if (!tenant) {
            return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
        }

        // Check if prayer wall is enabled
        if (!tenant.settings?.enablePrayerWall) {
            return NextResponse.json({ message: 'Prayer wall is not enabled for this tenant' }, { status: 403 });
        }

        // Return published community posts
        const posts = await prisma.communityPost.findMany({
            where: {
                tenantId: resolvedParams.tenantId,
                status: 'PUBLISHED',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(posts);
    } catch (error) {
        console.error(`Failed to fetch community posts for tenant ${resolvedParams.tenantId}:`, error);
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
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const resolvedParams = await params;
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
        const membership = await getMembershipForUserInTenant(userId, resolvedParams.tenantId);
        if (!membership) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const tenant = await prisma.tenant.findUnique({ 
            where: { id: resolvedParams.tenantId },
            include: { settings: true }
        });
        if (!tenant) {
            return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
        }

        // Check if prayer wall is enabled
        if (!tenant.settings?.enablePrayerWall) {
            return NextResponse.json({ message: 'Prayer wall is not enabled for this tenant' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const canCreate = await can(user, tenant, 'canManagePrayerWall');
        if (!canCreate) {
            return NextResponse.json({ message: 'You do not have permission to create a prayer request.' }, { status: 403 });
        }

        const newPost = await prisma.communityPost.create({
            data: {
                tenantId: resolvedParams.tenantId,
                authorUserId: result.data.isAnonymous ? null : userId,
                ...result.data,
                status: 'PENDING_APPROVAL', // Or PUBLISHED, depending on tenant settings
            },
        });

        return NextResponse.json(newPost, { status: 201 });
    } catch (error) {
        console.error(`Failed to create community post for tenant ${resolvedParams.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to create community post' }, { status: 500 });
    }
}
