import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
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
            where: { userId_tenantId: { userId, tenantId: tenantId } },
            include: { roles: true },
        }),
        prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { settings: true },
        })
    ]);

    if (!tenant) {
        return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
    }

    // Deny access if the directory is disabled and the user is not an admin/staff
    const roleNames = requestingMembership?.roles.map((role: any) => role.role) ?? [];
    const allowedRoles: TenantRole[] = [TenantRole.ADMIN, TenantRole.STAFF, TenantRole.MODERATOR];
    const canViewDirectory =
        tenant.settings?.enableMemberDirectory ||
        roleNames.some((role: any) => allowedRoles.includes(role));

    if (!canViewDirectory) {
        return NextResponse.json({ message: 'You do not have permission to view the member directory.' }, { status: 403 });
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
    console.error(`Failed to fetch members for tenant ${tenantId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch members' }, { status: 500 });
  }
}
