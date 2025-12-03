import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { handleApiError, unauthorized, forbidden, notFound } from '@/lib/api-response';
import { TenantRole, MembershipStatus } from '@/types';
import { prisma } from '@/lib/db';
import { getMembersForTenant } from '@/lib/data';

// 8.1 List Members
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const isSuperAdmin = Boolean((session?.user as any)?.isSuperAdmin);

  if (!userId) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  try {
    // First, check if the requesting user has permission to view the member list
    const [requestingMembership, tenant] = await Promise.all([
        prisma.userTenantMembership.findUnique({
            where: { userId_tenantId: { userId, tenantId: tenantId } },
            include: { roles: true },
        }),
        prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { settings: true },
        })
    ]);

    if (!tenant) {
      return notFound('Tenant');
    }

    // Platform admins can always view member directory
    if (isSuperAdmin) {
      const all = await getMembersForTenant(tenantId);
      const totalMembers = all.length;
      const start = offset;
      const end = offset + limit;
      const members = all.slice(start, end);

      return NextResponse.json({
          members,
          pagination: {
              page,
              limit,
              totalPages: Math.ceil(totalMembers / limit),
              totalResults: totalMembers,
          }
      });
    }

    // Deny access if the directory is disabled and the user is not an admin/staff
    const roleNames = requestingMembership?.roles.map((role: any) => role.role) ?? [];
    const allowedRoles: TenantRole[] = [TenantRole.ADMIN, TenantRole.STAFF, TenantRole.MODERATOR];
    const canViewDirectory =
        tenant.settings?.enableMemberDirectory ||
        roleNames.some((role: any) => allowedRoles.includes(role));

    if (!canViewDirectory) {
      return forbidden('You do not have permission to view the member directory.');
    }

    // Use shared helper to return enriched member objects (keeps the same shape as client expects)
    const all = await getMembersForTenant(tenantId);

    // If pagination requested, slice the array
    const totalMembers = all.length;
    const start = offset;
    const end = offset + limit;
    const members = all.slice(start, end);

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
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/members', tenantId, userId });
  }
}
