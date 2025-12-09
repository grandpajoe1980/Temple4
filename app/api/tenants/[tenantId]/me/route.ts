import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { handleApiError, notFound } from '@/lib/api-response';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/tenant-context';
import { hasRole, can } from '@/lib/permissions';
import { TenantRole } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const ctx = await getTenantContext(tenantId, userId);
    if (!ctx) {
      return notFound('Tenant');
    }

    const membership = ctx.membership;
    const tenant = ctx.tenant;

    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

    const permissions = {
      isAdmin: false,
      canApproveMembership: false,
      canBanMembers: false,
      canManagePrayerWall: false,
      canManageResources: false,
      canUploadResources: false,
      canManageContactSubmissions: false,
      canCreatePosts: false,
      canCreateEvents: false,
    } as Record<string, boolean>;

    if (user && tenant) {
      permissions.isAdmin = await hasRole(user.id, tenant.id, [TenantRole.ADMIN]);
      permissions.canApproveMembership = await can(user as any, tenant as any, 'canApproveMembership');
      permissions.canBanMembers = await can(user as any, tenant as any, 'canBanMembers');
      permissions.canManagePrayerWall = await can(user as any, tenant as any, 'canManagePrayerWall');
      permissions.canManageResources = await can(user as any, tenant as any, 'canManageResources');
      permissions.canUploadResources = await can(user as any, tenant as any, 'canUploadResources');
      permissions.canManageContactSubmissions = await can(user as any, tenant as any, 'canManageContactSubmissions');
      permissions.canCreatePosts = await can(user as any, tenant as any, 'canCreatePosts');
      permissions.canCreateEvents = await can(user as any, tenant as any, 'canCreateEvents');
      // New permission: whether the user's role allows viewing the tenant Work menu
      permissions.canViewWorkMenu = await can(user as any, tenant as any, 'canViewWorkMenu');
    }

    // Include tenant.permissions so clients can consult per-role permission defaults
    return NextResponse.json({ membership, tenant: { id: tenant.id, slug: tenant.slug, permissions: tenant.permissions }, permissions });
  } catch (error) {
    console.error('[tenant me] Error:', error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/me', tenantId });
  }
}
