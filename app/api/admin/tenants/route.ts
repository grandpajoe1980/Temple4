import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { MembershipApprovalMode } from '@/types';

const tenantUpdateSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  contactEmail: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  settings: z
    .object({
      isPublic: z.boolean().optional(),
      membershipApprovalMode: z.nativeEnum(MembershipApprovalMode).optional(),
    })
    .optional(),
});

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const isSuperAdmin = (session.user as { isSuperAdmin?: boolean }).isSuperAdmin;

  if (!isSuperAdmin) {
    throw NextResponse.json({ message: 'Forbidden - Super Admin access required' }, { status: 403 });
  }
}

export async function GET() {
  try {
    await requireSuperAdmin();

    const tenants = await prisma.tenant.findMany({
      include: {
        settings: true,
        branding: true,
        _count: {
          select: {
            memberships: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error('Failed to fetch tenants:', error);
    return NextResponse.json({ message: 'Failed to fetch tenants' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSuperAdmin();

    const payload = await request.json();
    const parsed = tenantUpdateSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Validation failed',
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { tenantId, settings, ...tenantFields } = parsed.data;

    if (tenantFields.slug) {
      const existingTenant = await prisma.tenant.findFirst({
        where: {
          slug: tenantFields.slug,
          id: { not: tenantId },
        },
        select: { id: true },
      });

      if (existingTenant) {
        return NextResponse.json(
          { message: 'A tenant with this slug already exists.' },
          { status: 409 }
        );
      }
    }

    const updatedTenant = await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: tenantFields,
      });

      if (settings && Object.keys(settings).length > 0) {
        await tx.tenantSettings.update({
          where: { tenantId },
          data: settings,
        });
      }

      return tx.tenant.findUnique({
        where: { id: tenantId },
        include: {
          settings: true,
          branding: true,
          _count: { select: { memberships: true } },
        },
      });
    });

    return NextResponse.json({ tenant: updatedTenant });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error(`Failed to update tenant:`, error);
    return NextResponse.json({ message: 'Failed to update tenant' }, { status: 500 });
  }
}
