import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMembershipForUserInTenant } from '@/lib/data';
import { can } from '@/lib/permissions';
import { z } from 'zod';
import { ResourceVisibility, FileType } from '@/types';
import { notFound, forbidden, handleApiError, unauthorized, validationError } from '@/lib/api-response';

// 16.3 Get Resource
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; resourceId: string }> }
) {
    const { resourceId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    try {
        const resource = await prisma.resourceItem.findUnique({
            where: { id: resourceId, tenantId: tenantId },
        });

        if (!resource) {
            return notFound('Resource');
        }

        if (resource.visibility === 'MEMBERS_ONLY') {
            const membership = await getMembershipForUserInTenant(userId, tenantId);
            if (!membership) {
                return forbidden('This resource is for members only.');
            }
        }

        return NextResponse.json(resource);
    } catch (error) {
        console.error(`Failed to fetch resource ${resourceId}:`, error);
        return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/resources/[resourceId]', resourceId, tenantId });
    }
}

const updateResourceSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    visibility: z.nativeEnum(ResourceVisibility).optional(),
});

// 16.4 Update Resource
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; resourceId: string }> }
) {
    const { resourceId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return unauthorized();
    }

    const result = updateResourceSchema.safeParse(await request.json());
    if (!result.success) {
        return validationError(result.error.flatten().fieldErrors);
    }

    try {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            return notFound('Tenant');
        }

        const canManage = await can(userId, tenant, 'canManageResources');
        if (!canManage) {
            return forbidden('You do not have permission to manage resources.');
        }

        const updatedResource = await prisma.resourceItem.update({
            where: { id: resourceId, tenantId: tenantId },
            data: result.data,
        });

        return NextResponse.json(updatedResource);
    } catch (error) {
        console.error(`Failed to update resource ${resourceId}:`, error);
        return handleApiError(error, { route: 'PUT /api/tenants/[tenantId]/resources/[resourceId]', resourceId, tenantId });
    }
}

// 16.5 Delete Resource
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; resourceId: string }> }
) {
    const { resourceId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return unauthorized();
    }

    try {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            return notFound('Tenant');
        }

        const canManage = await can(userId, tenant, 'canManageResources');
        if (!canManage) {
            return forbidden('You do not have permission to manage resources.');
        }

        await prisma.resourceItem.delete({
            where: { id: resourceId, tenantId: tenantId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete resource ${resourceId}:`, error);
        return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/resources/[resourceId]', resourceId, tenantId });
    }
}
