import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { handleApiError, unauthorized, forbidden, validationError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { hasRole, isGroupLeader } from '@/lib/permissions';
import { TenantRole } from '@/types';

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string; groupId: string }> }) {
  const { tenantId, groupId } = await params;
  try {
    const items = await prisma.smallGroupAnnouncement.findMany({ where: { groupId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ items });
  } catch (err: any) {
    console.error(`Failed to list announcements for tenant=${tenantId} group=${groupId}:`, err);
    return handleApiError(err, { route: 'GET /api/tenants/[tenantId]/small-groups/[groupId]/announcements', tenantId, groupId });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string; groupId: string }> }) {
  const { tenantId, groupId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return unauthorized();

  try {
    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = !!userRecord?.isSuperAdmin;
    const isLeader = await isGroupLeader(userId, groupId);
    const isTenantAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);
    if (!isLeader && !isTenantAdmin && !isSuperAdmin) {
      return forbidden('Forbidden');
    }

    const body = await request.json();
    const { title, body: content } = body;
    if (!title || !content) return validationError({ title: ['title required'], body: ['content required'] });

    const item = await prisma.smallGroupAnnouncement.create({ data: { tenantId, groupId, authorUserId: userId, title, body: content } });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error(`Failed to create announcement for group ${groupId}:`, err);
    return handleApiError(err, { route: 'POST /api/tenants/[tenantId]/small-groups/[groupId]/announcements', tenantId, groupId });
  }
}
