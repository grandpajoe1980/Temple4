import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { TenantRole } from '@/types';

const profileUpdateSchema = z.object({
  displayName: z.string().optional(),
  displayTitle: z.string().optional(),
});

// PATCH /api/tenants/[tenantId]/members/[userId]/profile - Update membership profile (display name/title)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; userId: string }> }
) {
  const { tenantId, userId } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id;

  if (!currentUserId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const result = profileUpdateSchema.safeParse(await request.json());
  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    // If updating someone else's profile, require admin role in the tenant
    if (currentUserId !== userId) {
      const currentUserMembership = await prisma.userTenantMembership.findUnique({
        where: { userId_tenantId: { userId: currentUserId, tenantId } },
        include: { roles: true }
      });

      const isAdmin = currentUserMembership?.roles.some((r: any) => r.role === TenantRole.ADMIN);
      if (!isAdmin) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
    }

    const membership = await prisma.userTenantMembership.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });

    if (!membership) {
      return NextResponse.json({ message: 'Membership not found' }, { status: 404 });
    }

    // Update membership displayName if provided
    const updatedMembership = await prisma.userTenantMembership.update({
      where: { userId_tenantId: { userId, tenantId } },
      data: {
        displayName: result.data.displayName ?? membership.displayName,
      },
    });

    // If a displayTitle was provided, persist it to the primary UserTenantRole record (if present)
    if (result.data.displayTitle !== undefined) {
      const primaryRole = await prisma.userTenantRole.findFirst({
        where: { membershipId: membership.id, isPrimary: true },
      });
      if (primaryRole) {
        await prisma.userTenantRole.update({
          where: { id: primaryRole.id },
          data: { displayTitle: result.data.displayTitle ?? primaryRole.displayTitle },
        });
      }
    }

    return NextResponse.json(updatedMembership);
  } catch (error) {
    console.error(`Failed to update membership profile for ${userId} in tenant ${tenantId}:`, error);
    return NextResponse.json({ message: 'Failed to update membership profile' }, { status: 500 });
  }
}
