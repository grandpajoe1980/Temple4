import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';

export async function DELETE(request: Request, { params }: { params: Promise<{ tenantId: string; tripId: string; userId: string }> }) {
  const { tenantId, tripId, userId } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id;

  if (!currentUserId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.tenantId !== tenantId) return NextResponse.json({ message: 'Trip not found' }, { status: 404 });

    const tripMembership = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: currentUserId } },
    });
    const isLeader = tripMembership?.role === 'LEADER' || tripMembership?.role === 'CO_LEADER';
    const isAdmin = (await hasRole(currentUserId, tenantId, [TenantRole.ADMIN])) || !!(session?.user as any)?.isSuperAdmin;

    if (!isLeader && !isAdmin) {
      return NextResponse.json({ message: 'Only trip leaders or tenant admins can reject members.' }, { status: 403 });
    }

    await prisma.tripMember.delete({ where: { tripId_userId: { tripId, userId } } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Failed to reject member ${userId} for trip ${tripId}:`, error);
    return NextResponse.json({ message: 'Failed to reject member' }, { status: 500 });
  }
}
