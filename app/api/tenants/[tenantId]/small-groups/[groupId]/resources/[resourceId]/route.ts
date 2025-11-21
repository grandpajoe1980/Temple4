import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hasRole, isGroupLeader } from '@/lib/permissions';
import { TenantRole } from '@/types';

export async function PUT(request: Request, { params }: { params: Promise<{ tenantId: string; groupId: string; resourceId: string }> }) {
  const { tenantId, groupId, resourceId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  try {
    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = !!userRecord?.isSuperAdmin;
    const isLeader = await isGroupLeader(userId, groupId);
    const isTenantAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);
    if (!isLeader && !isTenantAdmin && !isSuperAdmin) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { title, description, url } = body;
    const updated = await prisma.smallGroupResource.update({ where: { id: resourceId }, data: { title, description: description ?? null, url } });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('Failed to update resource', err);
    return NextResponse.json({ message: 'Failed to update resource' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ tenantId: string; groupId: string; resourceId: string }> }) {
  const { tenantId, groupId, resourceId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  try {
    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = !!userRecord?.isSuperAdmin;
    const isLeader = await isGroupLeader(userId, groupId);
    const isTenantAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);
    if (!isLeader && !isTenantAdmin && !isSuperAdmin) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    await prisma.smallGroupResource.delete({ where: { id: resourceId } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('Failed to delete resource', err);
    return NextResponse.json({ message: 'Failed to delete resource' }, { status: 500 });
  }
}
