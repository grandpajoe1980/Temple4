import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isGroupLeader } from '@/lib/permissions';
import { unauthorized, notFound, forbidden, handleApiError } from '@/lib/api-response';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string }> }
) {
  const { tenantId, groupId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) return unauthorized();

  try {
    const membership = await prisma.smallGroupMembership.findUnique({ where: { groupId_userId: { groupId, userId } } });
    if (!membership) return notFound('Membership');

    // Allow either the member themselves or a group leader/admin to remove
    const requesterIsLeader = await isGroupLeader(userId, groupId);
    if (membership.userId !== userId && !requesterIsLeader) {
      return forbidden('Forbidden');
    }

    await prisma.smallGroupMembership.delete({ where: { id: membership.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to leave group ${groupId}:`, error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/small-groups/[groupId]/leave', tenantId, groupId });
  }
}
