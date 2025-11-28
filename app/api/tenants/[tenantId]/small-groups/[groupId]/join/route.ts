import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { joinSmallGroup } from '@/lib/data';
import { unauthorized, forbidden, handleApiError } from '@/lib/api-response';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string }> }
) {
  const { tenantId, groupId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) return unauthorized();

  try {
    // Verify tenant membership
    const membership = await prisma.userTenantMembership.findUnique({ where: { userId_tenantId: { userId, tenantId } } });
    if (!membership || membership.status !== 'APPROVED') {
      return forbidden('You must be an approved tenant member to join groups');
    }

    const result = await joinSmallGroup(tenantId, groupId, userId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(`Failed to join group ${groupId}:`, error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/small-groups/[groupId]/join', tenantId, groupId });
  }
}
