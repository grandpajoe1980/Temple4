import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {  } from '@prisma/client';
import { TenantRole } from '@/types';
import { z } from 'zod';

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
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
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
        return NextResponse.json({ message: 'You do not have permission to view this tenant.' }, { status: 403 });
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
    return NextResponse.json({ message: 'Failed to fetch tenant' }, { status: 500 });
  }
}


const tenantUpdateSchema = z.object({
    name: z.string().min(3).optional(),
    slug: z.string().min(3).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    description: z.string().optional(),
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

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
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

    const hasPermission = membership?.roles.some((role: { role: TenantRole }) => role.role === TenantRole.ADMIN);

    if (!hasPermission) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const result = tenantUpdateSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, slug, description, settings, branding } = result.data;

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
                return NextResponse.json({ message: 'A tenant with this slug already exists.' }, { status: 409 });
            }
        }

        const updatedTenant = await prisma.tenant.update({
            where: { id: resolvedParams.tenantId },
            data: {
                ...(name && { name }),
                ...(slug && { slug }),
                ...(description && { description }),
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
        return NextResponse.json({ message: 'Failed to update tenant' }, { status: 500 });
    }
}
