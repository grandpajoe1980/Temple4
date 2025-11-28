import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { handleApiError, unauthorized, forbidden, validationError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { hasRole, isGroupLeader } from '@/lib/permissions';
import { TenantRole } from '@/types';

export async function PUT(request: Request, { params }: { params: Promise<{ tenantId: string; groupId: string; announcementId: string }> }) {
  const { tenantId, groupId, announcementId } = await params;
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

    const updated = await prisma.smallGroupAnnouncement.update({ where: { id: announcementId }, data: { title, body: content } });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(`Failed to update announcement ${announcementId}:`, err);
    return handleApiError(err, { route: 'PUT /api/tenants/[tenantId]/small-groups/[groupId]/announcements/[announcementId]', tenantId, groupId, announcementId });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ tenantId: string; groupId: string; announcementId: string }> }) {
  const { tenantId, groupId, announcementId } = await params;
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

    await prisma.smallGroupAnnouncement.delete({ where: { id: announcementId } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(`Failed to delete announcement ${announcementId}:`, err);
    return handleApiError(err, { route: 'DELETE /api/tenants/[tenantId]/small-groups/[groupId]/announcements/[announcementId]', tenantId, groupId, announcementId });
  }
}
