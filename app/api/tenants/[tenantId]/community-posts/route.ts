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

        // Resolve author display names and avatar URLs from user profiles
        const authorIds = Array.from(new Set(posts.map((p) => p.authorUserId).filter(Boolean))) as string[];
        let usersById: Record<string, any> = {};
        if (authorIds.length > 0) {
            const users = await prisma.user.findMany({
                where: { id: { in: authorIds } },
                include: { profile: true },
            });
            usersById = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {} as Record<string, any>);
        }

        const enrichedPosts = posts.map((post) => {
            if (post.isAnonymous || !post.authorUserId) {
                return {
                    ...post,
                    authorDisplayName: 'Anonymous',
                    authorAvatarUrl: undefined,
                };
            }

            const user = usersById[post.authorUserId];
            const displayName = user?.profile?.displayName || user?.email || post.authorUserId;
            const avatarUrl = user?.profile?.avatarUrl || undefined;

            return {
                ...post,
                authorDisplayName: displayName,
                authorAvatarUrl: avatarUrl,
            };
        });

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
