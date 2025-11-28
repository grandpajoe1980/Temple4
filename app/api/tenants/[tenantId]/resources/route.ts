import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMembershipForUserInTenant } from '@/lib/data';
import { can } from '@/lib/permissions';
import { z } from 'zod';
import { ResourceVisibility, FileType } from '@/types';
import { handleApiError, unauthorized, validationError, notFound, forbidden } from '@/lib/api-response';

// 16.1 List Resources
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    try {
        const membership = userId ? await getMembershipForUserInTenant(userId, tenantId) : null;
        const isMember = !!membership;

        const resources = await prisma.resourceItem.findMany({
            where: {
                tenantId: tenantId,
                // Public resources are visible to all, members-only to members
                visibility: isMember ? undefined : 'PUBLIC',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

            return NextResponse.json(resources);
        } catch (error) {
            console.error(`Failed to fetch resources for tenant ${tenantId}:`, error);
            return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/resources', tenantId });
        }
}

const resourceSchema = z.object({
    title: z.string().min(1),
    description: z.string(),
    fileUrl: z.string().url(),
    fileType: z.nativeEnum(FileType),
    visibility: z.nativeEnum(ResourceVisibility),
});

// 16.2 Upload Resource
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return unauthorized();
    }

    const result = resourceSchema.safeParse(await request.json());
    if (!result.success) {
        return validationError(result.error.flatten().fieldErrors);
    }

    try {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            return notFound('Tenant');
        }

        const canUpload = await can(userId, tenant, 'canUploadResources');
        if (!canUpload) {
            return forbidden('You do not have permission to upload resources.');
        }

        const newResource = await prisma.resourceItem.create({
            data: {
                tenantId: tenantId,
                uploaderUserId: userId,
                ...result.data,
            },
        });

        return NextResponse.json(newResource, { status: 201 });
    } catch (error) {
        console.error(`Failed to upload resource for tenant ${tenantId}:`, error);
        return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/resources', tenantId });
    }
}
