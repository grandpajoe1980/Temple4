import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TenantRole, MembershipStatus } from '@prisma/client';

// 8.4 List Membership Requests
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  // Check if the user has permission to view requests (ADMIN or STAFF)
  const membership = await prisma.userTenantMembership.findUnique({
    where: { userId_tenantId: { userId, tenantId: params.tenantId } },
    include: { roles: true },
  });

  const hasPermission = membership?.roles.some(role => [TenantRole.ADMIN, TenantRole.STAFF, TenantRole.MODERATOR].includes(role.role));

  if (!hasPermission) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const requests = await prisma.userTenantMembership.findMany({
      where: {
        tenantId: params.tenantId,
        status: MembershipStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            profile: true,
            email: true,
          },
        },
      },
      orderBy: {
        // createdAt doesn't exist on UserTenantMembership
        // You might want to add it to your schema
        // For now, let's order by something else, e.g., user's email
        user: {
            email: 'asc'
        }
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error(`Failed to fetch membership requests for tenant ${params.tenantId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch requests' }, { status: 500 });
  }
}
