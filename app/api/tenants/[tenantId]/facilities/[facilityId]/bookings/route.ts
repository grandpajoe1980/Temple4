import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { BookingStatus } from '@prisma/client';
import { getFacilityBookings, getMembershipForUserInTenant } from '@/lib/data';
import { TenantRole } from '@/types';
import { handleApiError } from '@/lib/api-response';

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string; facilityId: string }> }) {
  const { tenantId, facilityId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;
  const url = new URL(request.url);
  const viewAll = url.searchParams.get('all') === 'true';
  let statuses: BookingStatus[] = [BookingStatus.REQUESTED, BookingStatus.APPROVED];

  if (userId) {
    const membership = await getMembershipForUserInTenant(userId, tenantId);
    const isAdmin = membership?.roles.some((role: { role: TenantRole }) => role.role === TenantRole.ADMIN);

    if (isAdmin && viewAll) {
      statuses = [BookingStatus.REQUESTED, BookingStatus.APPROVED, BookingStatus.REJECTED, BookingStatus.CANCELLED];
    }
  }

  try {
    const bookings = await getFacilityBookings(tenantId, facilityId, statuses);
    return NextResponse.json(bookings);
  } catch (err: any) {
    console.error(`Failed to fetch bookings for facility ${facilityId}:`, err);
    return handleApiError(err, { route: 'GET /api/tenants/[tenantId]/facilities/[facilityId]/bookings', tenantId, facilityId });
  }
}
