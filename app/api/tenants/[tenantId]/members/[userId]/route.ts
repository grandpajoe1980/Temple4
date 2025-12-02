import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { handleApiError, unauthorized, forbidden, notFound, validationError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { TenantRole, MembershipStatus } from '@/types';
import { z } from 'zod';

const roleUpdateSchema = z.object({
  roles: z.array(z.nativeEnum(TenantRole)),
});

// 8.2 Update Member Role
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; userId: string }> }
) {
    const { tenantId, userId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!currentUserId) {
        return unauthorized();
    }

    // Check if the current user is a super admin or an ADMIN of this tenant
    const [currentUser, currentUserMembership] = await Promise.all([
        prisma.user.findUnique({ where: { id: currentUserId }, select: { isSuperAdmin: true } }),
        prisma.userTenantMembership.findUnique({
            where: { userId_tenantId: { userId: currentUserId, tenantId: tenantId } },
            include: { roles: true },
        }),
    ]);

    const isTenantAdmin = currentUserMembership?.roles.some((role: any) => role.role === TenantRole.ADMIN);
    const hasPermission = currentUser?.isSuperAdmin || isTenantAdmin;

    if (!hasPermission) {
        return forbidden('You must be an admin to change roles.');
    }

    // Prevent user from changing their own role, unless they're a super admin
    if (currentUserId === userId && !currentUser?.isSuperAdmin) {
        return validationError({ self: ['Admins cannot change their own role.'] });
    }

    const result = roleUpdateSchema.safeParse(await request.json());
    if (!result.success) {
        return validationError(result.error.flatten().fieldErrors);
    }

    try {
        const membership = await prisma.userTenantMembership.findUnique({
            where: { userId_tenantId: { userId: userId, tenantId: tenantId } },
        });

        if (!membership) {
            return notFound('Member');
        }

        // Disconnect all existing roles and connect the new ones
        await prisma.userTenantRole.deleteMany({
            where: {
                membershipId: membership.id,
            },
        });

        const updatedMembership = await prisma.userTenantMembership.update({
            where: { userId_tenantId: { userId: userId, tenantId: tenantId } },
            data: {
                roles: {
                    create: result.data.roles.map((role: any) => ({
                        role: role,
                    })),
                },
            },
            include: {
                roles: true,
            }
        });

        return NextResponse.json(updatedMembership);
    } catch (error) {
        return handleApiError(error, { route: 'PUT /api/tenants/[tenantId]/members/[userId]', tenantId, userId: currentUserId });
    }
}

// 8.4 Update membership status (approve/reject/ban/unban)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; userId: string }> }
) {
    const { tenantId, userId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!currentUserId) {
        return unauthorized();
    }

    // Check if the current user is a super admin or an ADMIN of this tenant
    const [currentUser, currentUserMembership] = await Promise.all([
        prisma.user.findUnique({ where: { id: currentUserId }, select: { isSuperAdmin: true } }),
        prisma.userTenantMembership.findUnique({
            where: { userId_tenantId: { userId: currentUserId, tenantId: tenantId } },
            include: { roles: true },
        }),
    ]);

    const isTenantAdmin = currentUserMembership?.roles.some((role: any) => role.role === TenantRole.ADMIN);
    const hasPermission = currentUser?.isSuperAdmin || isTenantAdmin;

    if (!hasPermission) {
        return forbidden('You must be an admin to change membership status.');
    }

    try {
        const body = await request.json();
        const { status } = body;
        if (!status) return validationError({ status: ['Missing status'] });

        const membership = await prisma.userTenantMembership.findUnique({
            where: { userId_tenantId: { userId: userId, tenantId: tenantId } },
        });

        if (!membership) {
            return notFound('Member');
        }

        const updated = await prisma.userTenantMembership.update({
            where: { userId_tenantId: { userId: userId, tenantId: tenantId } },
            data: { status: status as any },
        });

        return NextResponse.json(updated);
    } catch (error) {
        return handleApiError(error, { route: 'PATCH /api/tenants/[tenantId]/members/[userId]', tenantId, userId: currentUserId });
    }
}

// 8.3 Remove Member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; userId: string }> }
) {
    const { tenantId, userId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!currentUserId) {
        return unauthorized();
    }

    // Check if the current user is an ADMIN of this tenant
    const currentUserMembership = await prisma.userTenantMembership.findUnique({
        where: { userId_tenantId: { userId: currentUserId, tenantId: tenantId } },
        include: { roles: true },
    });

    const hasPermission = currentUserMembership?.roles.some((role: any) => role.role === TenantRole.ADMIN);

    if (!hasPermission) {
        return forbidden('You must be an admin to remove members.');
    }

    // Prevent user from removing themselves
    if (currentUserId === userId) {
        return validationError({ self: ['Admins cannot remove themselves.'] });
    }

    try {
        const membership = await prisma.userTenantMembership.findUnique({
            where: { userId_tenantId: { userId: userId, tenantId: tenantId } },
        });

        if (!membership) {
            return notFound('Member');
        }

        await prisma.userTenantRole.deleteMany({ where: { membershipId: membership.id } });
        await prisma.userTenantMembership.delete({
            where: { userId_tenantId: { userId: userId, tenantId: tenantId } },
        });
        return new NextResponse(null, { status: 204 }); // No Content
    } catch (error) {
        return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/members/[userId]', tenantId, userId: currentUserId });
    }
}
