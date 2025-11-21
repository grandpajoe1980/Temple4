import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMembershipForUserInTenant } from '@/lib/data';
import { hasRole, isGroupLeader } from '@/lib/permissions';
import { TenantRole } from '@/types';

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string; groupId: string }> }) {
  const { tenantId, groupId } = await params;
  try {
    const items = await prisma.smallGroupResource.findMany({ where: { groupId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ items });
  } catch (err) {
    console.error(`Failed to list resources for group ${groupId}:`, err);
    return NextResponse.json({ message: 'Failed to list resources' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string; groupId: string }> }) {
  const { tenantId, groupId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  try {
    // Check permissions: group leader, tenant admin, or platform super-admin
    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = !!userRecord?.isSuperAdmin;
    const isLeader = await isGroupLeader(userId, groupId);
    const membership = await getMembershipForUserInTenant(userId, tenantId);
    const isTenantAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);
    if (!isLeader && !isTenantAdmin && !isSuperAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, url } = body;
    if (!title || !url) return NextResponse.json({ message: 'title and url required' }, { status: 400 });

    const item = await prisma.smallGroupResource.create({ data: { tenantId, groupId, uploaderUserId: userId, title, description: description ?? null, url } });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error(`Failed to create resource for group ${groupId}:`, err);
    return NextResponse.json({ message: 'Failed to create resource' }, { status: 500 });
  }
}
