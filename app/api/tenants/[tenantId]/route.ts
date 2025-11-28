import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TenantRole } from '@/types';
import { TenantRole as PrismaTenantRole } from '@prisma/client';
import { z } from 'zod';
import { handleApiError, notFound, forbidden, unauthorized, validationError, conflict } from '@/lib/api-response';

// 7.2 Get Tenant Details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: resolvedParams.tenantId },
      include: {
        branding: true,
        settings: true,
      },
    });

    if (!tenant) {
      return notFound('Tenant');
    }

    // Check if user is a member of the tenant
    const membership = userId ? await prisma.userTenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: resolvedParams.tenantId,
        },
      },
    }) : null;

    // If tenant is not public and user is not a member, deny access
    if (!tenant.settings?.isPublic && !membership) {
      return forbidden('You do not have permission to view this tenant.');
    }

    // Non-members of public tenants see a limited view
    if (!membership) {
        const { settings, ...publicTenantData } = tenant;
        // Further filter what a non-member can see if necessary
        return NextResponse.json(publicTenantData);
    }

    // Members see everything
    return NextResponse.json(tenant);

  } catch (error) {
    console.error(`Failed to fetch tenant ${resolvedParams.tenantId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]', tenantId: resolvedParams.tenantId });
  }
}


const tenantUpdateSchema = z.object({
    name: z.string().min(3).optional(),
    slug: z.string().min(3).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    description: z.string().optional(),
    creed: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal('').transform(() => null)),
    phoneNumber: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    // Add nested objects for settings and branding
    settings: z.any().optional(),
    branding: z.any().optional(),
});

// 7.4 Update Tenant
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isSuperAdmin = Boolean((session?.user as any)?.isSuperAdmin);

    if (!userId) {
          return unauthorized();
      }

    // Check if the user is an ADMIN of this tenant
    const membership = await prisma.userTenantMembership.findUnique({
        where: {
            userId_tenantId: {
                userId,
                tenantId: resolvedParams.tenantId,
            },
        },
        include: {
            roles: true,
        }
    });

    const hasPermission =
      isSuperAdmin || membership?.roles.some((role: any) => role.role === PrismaTenantRole.ADMIN);

    if (!hasPermission) {
      return forbidden();
    }

    const result = tenantUpdateSchema.safeParse(await request.json());
    if (!result.success) {
      return validationError(result.error.flatten().fieldErrors);
    }

    const { name, slug, description, settings, branding, creed, contactEmail, phoneNumber, street, city, state, country, postalCode } = result.data;

    try {
        // If slug is being updated, check for uniqueness
        if (slug) {
            const existingTenant = await prisma.tenant.findFirst({
                where: {
                    slug: slug,
                    id: { not: resolvedParams.tenantId },
                }
            });
            if (existingTenant) {
              return conflict('A tenant with this slug already exists.');
            }
        }

        const updatedTenant = await prisma.tenant.update({
            where: { id: resolvedParams.tenantId },
            data: {
                ...(name && { name }),
                ...(slug && { slug }),
                ...(description && { description }),
                ...(creed && { creed }),
                ...(contactEmail !== undefined && { contactEmail }),
                ...(phoneNumber !== undefined && { phoneNumber }),
                ...(street && { street }),
                ...(city && { city }),
                ...(state && { state }),
                ...(country && { country }),
                ...(postalCode && { postalCode }),
                ...(settings && { settings: { update: settings } }),
                ...(branding && { branding: { update: branding } }),
            },
            include: {
                branding: true,
                settings: true,
            }
        });

        return NextResponse.json(updatedTenant);
    } catch (error) {
      console.error(`Failed to update tenant ${resolvedParams.tenantId}:`, error);
      return handleApiError(error, { route: 'PUT /api/tenants/[tenantId]', tenantId: resolvedParams.tenantId });
    }
}
