import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TenantRole } from '@prisma/client';
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
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Check if the current user is an ADMIN of this tenant
    const currentUserMembership = await prisma.userTenantMembership.findUnique({
        where: { userId_tenantId: { userId: currentUserId, tenantId: tenantId } },
        include: { roles: true },
    });

    const hasPermission = currentUserMembership?.roles.some(role => role.role === TenantRole.ADMIN);

    if (!hasPermission) {
        return NextResponse.json({ message: 'Forbidden: You must be an admin to change roles.' }, { status: 403 });
    }

    // Prevent user from changing their own role
    if (currentUserId === userId) {
        return NextResponse.json({ message: 'Admins cannot change their own role.' }, { status: 400 });
    }

    const result = roleUpdateSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const membership = await prisma.userTenantMembership.findUnique({
            where: { userId_tenantId: { userId: userId, tenantId: tenantId } },
        });

        if (!membership) {
            return NextResponse.json({ message: 'Member not found' }, { status: 404 });
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
                    create: result.data.roles.map(role => ({
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
        console.error(`Failed to update role for user ${userId} in tenant ${tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to update role' }, { status: 500 });
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
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Check if the current user is an ADMIN of this tenant
    const currentUserMembership = await prisma.userTenantMembership.findUnique({
        where: { userId_tenantId: { userId: currentUserId, tenantId: tenantId } },
        include: { roles: true },
    });

    const hasPermission = currentUserMembership?.roles.some(role => role.role === TenantRole.ADMIN);

    if (!hasPermission) {
        return NextResponse.json({ message: 'Forbidden: You must be an admin to remove members.' }, { status: 403 });
    }

    // Prevent user from removing themselves
    if (currentUserId === userId) {
        return NextResponse.json({ message: 'Admins cannot remove themselves.' }, { status: 400 });
    }

    try {
        const membership = await prisma.userTenantMembership.findUnique({
            where: { userId_tenantId: { userId: userId, tenantId: tenantId } },
        });

        if (!membership) {
            return NextResponse.json({ message: 'Member not found' }, { status: 404 });
        }

        await prisma.userTenantRole.deleteMany({ where: { membershipId: membership.id } });
        await prisma.userTenantMembership.delete({
            where: { userId_tenantId: { userId: userId, tenantId: tenantId } },
        });
        return new NextResponse(null, { status: 204 }); // No Content
    } catch (error) {
        console.error(`Failed to remove user ${userId} from tenant ${tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to remove member' }, { status: 500 });
    }
}
