import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hasRole, isGroupLeader } from '@/lib/permissions';
import { TenantRole } from '@/types';

export async function PUT(request: Request, { params }: { params: Promise<{ tenantId: string; groupId: string; announcementId: string }> }) {
  const { tenantId, groupId, announcementId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  try {
    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = !!userRecord?.isSuperAdmin;
    const isLeader = await isGroupLeader(userId, groupId);
    const isTenantAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);
    if (!isLeader && !isTenantAdmin && !isSuperAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: content } = body;
    if (!title || !content) return NextResponse.json({ message: 'title and body required' }, { status: 400 });

    const updated = await prisma.smallGroupAnnouncement.update({ where: { id: announcementId }, data: { title, body: content } });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(`Failed to update announcement ${announcementId}:`, err);
    return NextResponse.json({ message: 'Failed to update announcement' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ tenantId: string; groupId: string; announcementId: string }> }) {
  const { tenantId, groupId, announcementId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  try {
    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = !!userRecord?.isSuperAdmin;
    const isLeader = await isGroupLeader(userId, groupId);
    const isTenantAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);
    if (!isLeader && !isTenantAdmin && !isSuperAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await prisma.smallGroupAnnouncement.delete({ where: { id: announcementId } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(`Failed to delete announcement ${announcementId}:`, err);
    return NextResponse.json({ message: 'Failed to delete announcement' }, { status: 500 });
  }
}
