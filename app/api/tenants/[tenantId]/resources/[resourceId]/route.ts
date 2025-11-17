import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMembershipForUserInTenant } from '@/lib/data';
import { can } from '@/lib/permissions';
import { z } from 'zod';
import { ResourceVisibility, FileType } from '@prisma/client';

// 16.3 Get Resource
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string; resourceId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    try {
        const resource = await prisma.resourceItem.findUnique({
            where: { id: params.resourceId, tenantId: params.tenantId },
        });

        if (!resource) {
            return NextResponse.json({ message: 'Resource not found' }, { status: 404 });
        }

        if (resource.visibility === 'MEMBERS_ONLY') {
            const membership = await getMembershipForUserInTenant(userId, params.tenantId);
            if (!membership) {
                return NextResponse.json({ message: 'This resource is for members only.' }, { status: 403 });
            }
        }

        return NextResponse.json(resource);
    } catch (error) {
        console.error(`Failed to fetch resource ${params.resourceId}:`, error);
        return NextResponse.json({ message: 'Failed to fetch resource' }, { status: 500 });
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
  { params }: { params: { tenantId: string; resourceId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const result = updateResourceSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } });
        if (!tenant) {
            return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
        }

        const canManage = await can(userId, tenant, 'canManageResources');
        if (!canManage) {
            return NextResponse.json({ message: 'You do not have permission to manage resources.' }, { status: 403 });
        }

        const updatedResource = await prisma.resourceItem.update({
            where: { id: params.resourceId, tenantId: params.tenantId },
            data: result.data,
        });

        return NextResponse.json(updatedResource);
    } catch (error) {
        console.error(`Failed to update resource ${params.resourceId}:`, error);
        return NextResponse.json({ message: 'Failed to update resource' }, { status: 500 });
    }
}

// 16.5 Delete Resource
export async function DELETE(
  request: Request,
  { params }: { params: { tenantId: string; resourceId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } });
        if (!tenant) {
            return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
        }

        const canManage = await can(userId, tenant, 'canManageResources');
        if (!canManage) {
            return NextResponse.json({ message: 'You do not have permission to manage resources.' }, { status: 403 });
        }

        await prisma.resourceItem.delete({
            where: { id: params.resourceId, tenantId: params.tenantId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete resource ${params.resourceId}:`, error);
        return NextResponse.json({ message: 'Failed to delete resource' }, { status: 500 });
    }
}
