import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { handleApiError, unauthorized, forbidden } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { TenantRole, MembershipStatus } from '@/types';

// 8.4 List Membership Requests
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return unauthorized();
  }

  // Check if the user has permission to view requests (ADMIN or STAFF)
  const membership = await prisma.userTenantMembership.findUnique({
    where: { userId_tenantId: { userId, tenantId: tenantId } },
    include: { roles: true },
  });

  const hasPermission = membership?.roles.some((role: any) => 
    ([TenantRole.ADMIN, TenantRole.STAFF, TenantRole.MODERATOR] as TenantRole[]).includes(role.role)
  );

  if (!hasPermission) {
    return forbidden('Forbidden');
  }

  try {
    const requests = await prisma.userTenantMembership.findMany({
      where: {
        tenantId: tenantId,
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
    console.error(`Failed to fetch membership requests for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/requests', tenantId });
  }
}
