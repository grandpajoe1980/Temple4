import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { joinSmallGroup } from '@/lib/data';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string }> }
) {
  const { tenantId, groupId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  try {
    // Verify tenant membership
    const membership = await prisma.userTenantMembership.findUnique({ where: { userId_tenantId: { userId, tenantId } } });
    if (!membership || membership.status !== 'APPROVED') {
      return NextResponse.json({ message: 'You must be an approved tenant member to join groups' }, { status: 403 });
    }

    const result = await joinSmallGroup(tenantId, groupId, userId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(`Failed to join group ${groupId}:`, error);
    return NextResponse.json({ message: (error as any)?.message || 'Failed to join group' }, { status: 500 });
  }
}
