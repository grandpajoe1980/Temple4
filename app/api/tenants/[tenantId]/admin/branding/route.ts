import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hasRole } from '@/lib/permissions';
import { z } from 'zod';
import { TenantRole } from '@/types';
import { unauthorized, forbidden, validationError, handleApiError } from '@/lib/api-response';

// 17.3 Get Tenant Branding
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
        return unauthorized();
    }

    try {
        const isAdmin = await hasRole(user.id, tenantId, [TenantRole.ADMIN]);
        if (!isAdmin) {
            return forbidden('You do not have permission to view tenant branding.');
        }

        const branding = await prisma.tenantBranding.findUnique({
            where: { tenantId: tenantId },
        });

        return NextResponse.json(branding);
    } catch (error) {
        console.error(`Failed to fetch tenant branding for tenant ${tenantId}:`, error);
        return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/admin/branding', tenantId });
    }
}

const secureUrl = z.string().url().refine((value) => value.startsWith('https://'), {
    message: 'URL must use https://',
});

const brandingSchema = z.object({
    logoUrl: secureUrl.optional(),
    bannerImageUrl: secureUrl.optional(),
    primaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    customLinks: z.array(
        z.object({
            label: z.string(),
            url: secureUrl,
            showInFooter: z.boolean().optional(),
        })
    ).optional(),
    socialLinks: z.array(
        z.object({
            platform: z.string(),
            url: secureUrl,
            label: z.string().optional(),
            showInFooter: z.boolean().optional(),
        })
    ).optional(),
    facebookUrl: secureUrl.optional().or(z.literal('')),
    instagramUrl: secureUrl.optional().or(z.literal('')),
    twitterUrl: secureUrl.optional().or(z.literal('')),
    xUrl: secureUrl.optional().or(z.literal('')),
    tiktokUrl: secureUrl.optional().or(z.literal('')),
    youtubeUrl: secureUrl.optional().or(z.literal('')),
    websiteUrl: secureUrl.optional().or(z.literal('')),
    linkedInUrl: secureUrl.optional().or(z.literal('')),
});

// 17.4 Update Tenant Branding
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
        return unauthorized();
    }

    const result = brandingSchema.safeParse(await request.json());
    if (!result.success) {
        return validationError(result.error.flatten().fieldErrors);
    }

    try {
        const isAdmin = await hasRole(user.id, tenantId, [TenantRole.ADMIN]);
        if (!isAdmin) {
            return forbidden('You do not have permission to update tenant branding.');
        }

        const updatedBranding = await prisma.tenantBranding.update({
            where: { tenantId: tenantId },
            data: result.data,
        });

        return NextResponse.json(updatedBranding);
    } catch (error) {
        console.error(`Failed to update tenant branding for tenant ${tenantId}:`, error);
        return handleApiError(error, { route: 'PUT /api/tenants/[tenantId]/admin/branding', tenantId });
    }
}

// PATCH handler for partial updates (same as PUT but more semantically correct)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    return PUT(request, { params });
}
