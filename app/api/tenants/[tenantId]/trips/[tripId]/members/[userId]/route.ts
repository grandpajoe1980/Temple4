import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { unauthorized, notFound, forbidden, handleApiError } from '@/lib/api-response';

export async function DELETE(request: Request, { params }: { params: Promise<{ tenantId: string; tripId: string; userId: string }> }) {
  const { tenantId, tripId, userId } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id;

  if (!currentUserId) return unauthorized();

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.tenantId !== tenantId) return notFound('Trip');

    const tripMembership = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: currentUserId } },
    });
    const isLeader = tripMembership?.role === 'LEADER' || tripMembership?.role === 'CO_LEADER';
    const isAdmin = (await hasRole(currentUserId, tenantId, [TenantRole.ADMIN])) || !!(session?.user as any)?.isSuperAdmin;

    if (!isLeader && !isAdmin) {
      return forbidden('Only trip leaders or tenant admins can reject members.');
    }

    await prisma.tripMember.delete({ where: { tripId_userId: { tripId, userId } } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Failed to reject member ${userId} for trip ${tripId}:`, error);
    return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/trips/[tripId]/members/[userId]', tenantId, tripId, userId });
  }
}
