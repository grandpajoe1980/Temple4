import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
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
    const message = err?.message || 'Failed to list announcements';
    return NextResponse.json({ message, details: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string; groupId: string }> }) {
  const { tenantId, groupId } = await params;
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

    const item = await prisma.smallGroupAnnouncement.create({ data: { tenantId, groupId, authorUserId: userId, title, body: content } });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error(`Failed to create announcement for group ${groupId}:`, err);
    return NextResponse.json({ message: 'Failed to create announcement' }, { status: 500 });
  }
}
