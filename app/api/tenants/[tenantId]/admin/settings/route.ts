import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hasRole } from '@/lib/permissions';
import { z } from 'zod';
import { TenantRole } from '@prisma/client';

// 17.1 Get Tenant Settings
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const isAdmin = await hasRole(user.id, tenantId, [TenantRole.ADMIN]);
        if (!isAdmin) {
            return NextResponse.json({ message: 'You do not have permission to view tenant settings.' }, { status: 403 });
        }

        const settings = await prisma.tenantSettings.findUnique({
            where: { tenantId: tenantId },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error(`Failed to fetch tenant settings for tenant ${tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to fetch tenant settings' }, { status: 500 });
    }
}

const settingsSchema = z.object({
    isPublic: z.boolean().optional(),
    // Add other settings fields here
});

// 17.2 Update Tenant Settings
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const result = settingsSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const isAdmin = await hasRole(user.id, tenantId, [TenantRole.ADMIN]);
        if (!isAdmin) {
            return NextResponse.json({ message: 'You do not have permission to update tenant settings.' }, { status: 403 });
        }

        const updatedSettings = await prisma.tenantSettings.update({
            where: { tenantId: tenantId },
            data: result.data,
        });

        return NextResponse.json(updatedSettings);
    } catch (error) {
        console.error(`Failed to update tenant settings for tenant ${tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to update tenant settings' }, { status: 500 });
    }
}
