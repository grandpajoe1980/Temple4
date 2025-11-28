import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMembershipForUserInTenant } from '@/lib/data';
import { isGroupLeader } from '@/lib/permissions';
import { hasRole } from '@/lib/permissions';
import { handleApiError, unauthorized, forbidden } from '@/lib/api-response';
import { TenantRole } from '@/types';

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string; groupId: string }> }) {
  const { tenantId, groupId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const isSuperAdmin = (session?.user as any)?.isSuperAdmin;

  if (!userId) return unauthorized();

  try {
    // Allow if user is tenant admin/staff/moderator or a group leader
    const membership = await getMembershipForUserInTenant(userId, tenantId);
    const isLeader = await isGroupLeader(userId, groupId);
    const isTenantAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN, TenantRole.STAFF, TenantRole.MODERATOR]);

    if (!isLeader && !isTenantAdmin && !isSuperAdmin) {
      return forbidden('Forbidden');
    }

    // Fetch tenant users (members) with basic profile info
    const members = await prisma.userTenantMembership.findMany({
      where: { tenantId, status: 'APPROVED' },
      include: { user: { select: { id: true, email: true, profile: true } }, roles: true },
      orderBy: { id: 'asc' },
    });

    const users = members.map(m => ({ id: m.user.id, email: m.user.email, displayName: m.user.profile?.displayName || null }));
    return NextResponse.json({ users });
  } catch (err) {
    console.error(`Failed to list tenant users for tenant=${tenantId} group=${groupId}:`, err);
    return handleApiError(err, { route: 'GET /api/tenants/[tenantId]/small-groups/[groupId]/tenant-users', tenantId, groupId });
  }
}
