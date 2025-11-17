import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { TenantRole, MembershipStatus } from '@prisma/client';
import { prisma } from '@/lib/db';

// 8.1 List Members
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  try {
    // First, check if the requesting user has permission to view the member list
    const [requestingMembership, tenant] = await Promise.all([
        prisma.userTenantMembership.findUnique({
            where: { userId_tenantId: { userId, tenantId: params.tenantId } },
            include: { roles: true },
        }),
        prisma.tenant.findUnique({
            where: { id: params.tenantId },
            include: { settings: true },
        })
    ]);

    if (!tenant) {
        return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
    }

    // Deny access if the directory is disabled and the user is not an admin/staff
    const roleNames = requestingMembership?.roles.map(role => role.role) ?? [];
    const canViewDirectory =
        tenant.settings?.enableMemberDirectory ||
        roleNames.some(role => [TenantRole.ADMIN, TenantRole.STAFF, TenantRole.MODERATOR].includes(role));

    if (!canViewDirectory) {
        return NextResponse.json({ message: 'You do not have permission to view the member directory.' }, { status: 403 });
    }

    const members = await prisma.userTenantMembership.findMany({
      where: {
        tenantId: params.tenantId,
        status: MembershipStatus.APPROVED,
      },
      include: {
        user: {
          select: {
            id: true,
            profile: true,
          },
        },
        roles: true,
      },
      skip: offset,
      take: limit,
      orderBy: {
        user: {
          profile: {
            displayName: 'asc',
          },
        },
      },
    });

    const totalMembers = await prisma.userTenantMembership.count({
        where: {
            tenantId: params.tenantId,
            status: MembershipStatus.APPROVED,
        }
    });

    return NextResponse.json({
        members,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalMembers / limit),
            totalResults: totalMembers,
        }
    });
  } catch (error) {
    console.error(`Failed to fetch members for tenant ${params.tenantId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch members' }, { status: 500 });
  }
}
