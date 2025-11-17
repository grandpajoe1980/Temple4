import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMembershipForUserInTenant } from '@/lib/data';
import { can } from '@/lib/permissions';
import { z } from 'zod';
import { ResourceVisibility, FileType } from '@prisma/client';

// 16.1 List Resources
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    try {
        const membership = await getMembershipForUserInTenant(userId, params.tenantId);
        const isMember = !!membership;

        const resources = await prisma.resourceItem.findMany({
            where: {
                tenantId: params.tenantId,
                // Public resources are visible to all, members-only to members
                visibility: isMember ? undefined : 'PUBLIC',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(resources);
    } catch (error) {
        console.error(`Failed to fetch resources for tenant ${params.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to fetch resources' }, { status: 500 });
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
  { params }: { params: { tenantId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const result = resourceSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } });
        if (!tenant) {
            return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
        }

        const canUpload = await can(userId, tenant, 'canUploadResources');
        if (!canUpload) {
            return NextResponse.json({ message: 'You do not have permission to upload resources.' }, { status: 403 });
        }

        const newResource = await prisma.resourceItem.create({
            data: {
                tenantId: params.tenantId,
                uploaderUserId: userId,
                ...result.data,
            },
        });

        return NextResponse.json(newResource, { status: 201 });
    } catch (error) {
        console.error(`Failed to upload resource for tenant ${params.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to upload resource' }, { status: 500 });
    }
}
