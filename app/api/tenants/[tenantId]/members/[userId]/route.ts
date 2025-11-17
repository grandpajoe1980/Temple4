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
  { params }: { params: { tenantId: string; userId: string } }
) {
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!currentUserId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Check if the current user is an ADMIN of this tenant
    const currentUserMembership = await prisma.userTenantMembership.findUnique({
        where: { userId_tenantId: { userId: currentUserId, tenantId: params.tenantId } },
        include: { roles: true },
    });

    const hasPermission = currentUserMembership?.roles.some(role => role.role === TenantRole.ADMIN);

    if (!hasPermission) {
        return NextResponse.json({ message: 'Forbidden: You must be an admin to change roles.' }, { status: 403 });
    }

    // Prevent user from changing their own role
    if (currentUserId === params.userId) {
        return NextResponse.json({ message: 'Admins cannot change their own role.' }, { status: 400 });
    }

    const result = roleUpdateSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        // Disconnect all existing roles and connect the new ones
        await prisma.userTenantMembershipRole.deleteMany({
            where: {
                userTenantMembershipUserId: params.userId,
                userTenantMembershipTenantId: params.tenantId,
            },
        });

        const updatedMembership = await prisma.userTenantMembership.update({
            where: { userId_tenantId: { userId: params.userId, tenantId: params.tenantId } },
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
        console.error(`Failed to update role for user ${params.userId} in tenant ${params.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to update role' }, { status: 500 });
    }
}

// 8.3 Remove Member
export async function DELETE(
  request: Request,
  { params }: { params: { tenantId: string; userId: string } }
) {
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!currentUserId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Check if the current user is an ADMIN of this tenant
    const currentUserMembership = await prisma.userTenantMembership.findUnique({
        where: { userId_tenantId: { userId: currentUserId, tenantId: params.tenantId } },
        include: { roles: true },
    });

    const hasPermission = currentUserMembership?.roles.some(role => role.role === TenantRole.ADMIN);

    if (!hasPermission) {
        return NextResponse.json({ message: 'Forbidden: You must be an admin to remove members.' }, { status: 403 });
    }

    // Prevent user from removing themselves
    if (currentUserId === params.userId) {
        return NextResponse.json({ message: 'Admins cannot remove themselves.' }, { status: 400 });
    }

    try {
        await prisma.userTenantMembership.delete({
            where: { userId_tenantId: { userId: params.userId, tenantId: params.tenantId } },
        });
        return new NextResponse(null, { status: 204 }); // No Content
    } catch (error) {
        console.error(`Failed to remove user ${params.userId} from tenant ${params.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to remove member' }, { status: 500 });
    }
}
