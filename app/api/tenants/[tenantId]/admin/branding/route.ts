import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hasRole } from '@/lib/permissions';
import { z } from 'zod';
import { TenantRole } from '@prisma/client';

// 17.3 Get Tenant Branding
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const isAdmin = await hasRole(user.id, params.tenantId, [TenantRole.ADMIN]);
        if (!isAdmin) {
            return NextResponse.json({ message: 'You do not have permission to view tenant branding.' }, { status: 403 });
        }

        const branding = await prisma.tenantBranding.findUnique({
            where: { tenantId: params.tenantId },
        });

        return NextResponse.json(branding);
    } catch (error) {
        console.error(`Failed to fetch tenant branding for tenant ${params.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to fetch tenant branding' }, { status: 500 });
    }
}

const brandingSchema = z.object({
    logoUrl: z.string().url().optional(),
    bannerImageUrl: z.string().url().optional(),
    primaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    customLinks: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
});

// 17.4 Update Tenant Branding
export async function PUT(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const result = brandingSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const isAdmin = await hasRole(user.id, params.tenantId, [TenantRole.ADMIN]);
        if (!isAdmin) {
            return NextResponse.json({ message: 'You do not have permission to update tenant branding.' }, { status: 403 });
        }

        const updatedBranding = await prisma.tenantBranding.update({
            where: { tenantId: params.tenantId },
            data: result.data,
        });

        return NextResponse.json(updatedBranding);
    } catch (error) {
        console.error(`Failed to update tenant branding for tenant ${params.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to update tenant branding' }, { status: 500 });
    }
}
