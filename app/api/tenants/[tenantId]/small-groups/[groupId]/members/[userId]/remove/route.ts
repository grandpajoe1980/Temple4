import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isGroupLeader } from '@/lib/permissions';
import { unauthorized, forbidden, notFound, handleApiError } from '@/lib/api-response';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string; userId: string }> }
) {
  const { tenantId, groupId, userId: targetUserId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) return unauthorized();

  try {
    const requesterIsLeader = await isGroupLeader(userId, groupId);
    if (!requesterIsLeader && userId !== targetUserId) {
      return forbidden('Forbidden');
    }

    const membership = await prisma.smallGroupMembership.findUnique({ where: { groupId_userId: { groupId, userId: targetUserId } } });
    if (!membership) return notFound('Membership');

    await prisma.smallGroupMembership.delete({ where: { id: membership.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to remove member ${targetUserId} from group ${groupId}:`, error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/small-groups/[groupId]/members/[userId]/remove', tenantId, groupId, targetUserId });
  }
}
