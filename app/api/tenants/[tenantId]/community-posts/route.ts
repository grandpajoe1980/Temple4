import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMembershipForUserInTenant } from '@/lib/data';
import { can } from '@/lib/permissions';
import { handleApiError, unauthorized, forbidden, notFound, validationError } from '@/lib/api-response';
import { z } from 'zod';
import { CommunityPostType, CommunityPostStatus } from '@/types';

// 15.1 List Community Posts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const resolvedParams = await params;
    const includePrivate = new URL(request.url).searchParams.get('includePrivate') === 'true';
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return unauthorized();
    }

    try {
        // Allow authenticated users to view - membership check removed
        // Members get full view, non-members might get limited view based on tenant settings
        const tenant = await prisma.tenant.findUnique({
            where: { id: resolvedParams.tenantId },
            include: { settings: true }
        });
        if (!tenant) {
            return notFound('Tenant');
        }

        // Check if prayer wall is enabled
        if (!tenant.settings?.enablePrayerWall) {
            return forbidden('Prayer wall is not enabled for this tenant');
        }

        let statusFilter: { status?: CommunityPostStatus } = { status: CommunityPostStatus.PUBLISHED };

        if (includePrivate) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                return notFound('User');
            }

            const canViewAllPosts = await can(user, tenant, 'canManagePrayerWall');
            if (!canViewAllPosts) {
                return forbidden('You do not have permission to manage the prayer wall.');
            }

            statusFilter = {};
        }

        // Return community posts based on visibility
        const posts = await prisma.communityPost.findMany({
            where: {
                tenantId: resolvedParams.tenantId,
                ...statusFilter,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const enrichedPosts = posts.map((post) => ({
            ...post,
            authorDisplayName: post.isAnonymous ? 'Anonymous' : post.authorUserId || 'Unknown',
            authorAvatarUrl: undefined,
        }));

        return NextResponse.json(enrichedPosts);
    } catch (error) {
        console.error(`Failed to fetch community posts for tenant ${resolvedParams.tenantId}:`, error);
        return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/community-posts', tenantId: resolvedParams.tenantId });
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
        return unauthorized();
    }

    const result = postSchema.safeParse(await request.json());
    if (!result.success) {
        return validationError(result.error.flatten().fieldErrors);
    }

    try {
        const membership = await getMembershipForUserInTenant(userId, resolvedParams.tenantId);
        if (!membership || membership.status !== 'APPROVED') {
            return forbidden('Forbidden');
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: resolvedParams.tenantId },
            include: { settings: true }
        });
        if (!tenant) {
            return notFound('Tenant');
        }

        // Check if prayer wall is enabled
        if (!tenant.settings?.enablePrayerWall) {
            return forbidden('Prayer wall is not enabled for this tenant');
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return notFound('User');
        }

        const newPost = await prisma.communityPost.create({
            data: {
                tenantId: resolvedParams.tenantId,
                authorUserId: result.data.isAnonymous ? null : userId,
                ...result.data,
                status: tenant.settings?.autoApprovePrayerWall
                    ? CommunityPostStatus.PUBLISHED
                    : CommunityPostStatus.PENDING_APPROVAL,
            },
        });

        return NextResponse.json(newPost, { status: 201 });
    } catch (error) {
        console.error(`Failed to create community post for tenant ${resolvedParams.tenantId}:`, error);
        return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/community-posts', tenantId: resolvedParams.tenantId });
    }
}
