import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getMembershipForUserInTenant } from '@/lib/data';

const prisma = new PrismaClient();

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
    const requestingUserMembership = await getMembershipForUserInTenant(userId, params.tenantId);
    const tenant = await prisma.tenant.findUnique({
        where: { id: params.tenantId },
        include: { settings: true }
    });

    if (!tenant) {
        return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
    }

    // Deny access if the directory is disabled and the user is not an admin/staff
    const canViewDirectory = tenant.settings?.enableMemberDirectory || 
                             ['ADMIN', 'STAFF', 'MODERATOR'].includes(requestingUserMembership?.role || '');

    if (!canViewDirectory) {
        return NextResponse.json({ message: 'You do not have permission to view the member directory.' }, { status: 403 });
    }

    const members = await prisma.membership.findMany({
      where: {
        tenantId: params.tenantId,
        status: 'APPROVED', // Only list approved members
      },
      include: {
        user: {
          select: {
            id: true,
            profile: true,
          },
        },
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

    const totalMembers = await prisma.membership.count({
        where: {
            tenantId: params.tenantId,
            status: 'APPROVED',
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
