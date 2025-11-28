import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { approveTripMember, getMembershipForUserInTenant } from '@/lib/data';
import { prisma } from '@/lib/db';
import { unauthorized, forbidden, handleApiError } from '@/lib/api-response';

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string; tripId: string; userId: string }> }) {
  const { tenantId, tripId, userId } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id;

  if (!currentUserId) return unauthorized();

  try {
    const membership = await getMembershipForUserInTenant(currentUserId, tenantId);
    const userRecord = await prisma.user.findUnique({ where: { id: currentUserId } });
    const isSuperAdmin = !!userRecord?.isSuperAdmin;
    const membershipRoles = membership?.roles?.map((r: any) => r.role) || [];
    const isTenantManager = membershipRoles.some((r: string) => ['ADMIN', 'OWNER', 'STAFF', 'CLERGY'].includes(r));
    const isAdmin = isSuperAdmin || isTenantManager;

    const tripMembership = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: currentUserId } },
    });

    if (!isAdmin && !(tripMembership?.role === 'LEADER' || tripMembership?.role === 'CO_LEADER')) {
      return forbidden('Only trip leaders or tenant admins can approve members');
    }

    const updated = await approveTripMember(tripId, userId, currentUserId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error(`Failed to approve trip member ${userId} for trip ${tripId}:`, error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/trips/[tripId]/members/[userId]/approve', tenantId, tripId, userId });
  }
}
