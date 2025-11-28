import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMembershipForUserInTenant } from '@/lib/data';
import { hasRole, isGroupLeader } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { handleApiError, unauthorized, forbidden, validationError } from '@/lib/api-response';

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string; groupId: string }> }) {
  const { tenantId, groupId } = await params;
  try {
    const items = await prisma.smallGroupResource.findMany({ where: { groupId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ items });
  } catch (err) {
    console.error(`Failed to list resources for group ${groupId}:`, err);
    return handleApiError(err, { route: 'GET /api/tenants/[tenantId]/small-groups/[groupId]/resources', tenantId, groupId });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string; groupId: string }> }) {
  const { tenantId, groupId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return unauthorized();

  try {
    // Check permissions: group leader, tenant admin, or platform super-admin
    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = !!userRecord?.isSuperAdmin;
    const isLeader = await isGroupLeader(userId, groupId);
    const membership = await getMembershipForUserInTenant(userId, tenantId);
    const isTenantAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);
    if (!isLeader && !isTenantAdmin && !isSuperAdmin) {
      return forbidden('Forbidden');
    }

    const body = await request.json();
    const { title, description, url } = body;
    if (!title) return validationError({ title: ['title required'] });

    const item = await prisma.smallGroupResource.create({ data: { tenantId, groupId, uploaderUserId: userId, title, description: description ?? null, url: url ?? null } });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error(`Failed to create resource for group ${groupId}:`, err);
    return handleApiError(err, { route: 'POST /api/tenants/[tenantId]/small-groups/[groupId]/resources', tenantId, groupId });
  }
}
