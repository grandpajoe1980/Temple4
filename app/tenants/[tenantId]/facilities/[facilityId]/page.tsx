import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getFacilityById, getMembershipForUserInTenant, getTenantById } from '@/lib/data';
import FacilityDetailPage from '@/app/components/tenant/FacilityDetailPage';
import type { Facility, FacilityBlackout, FacilityBooking } from '@/types';

export default async function FacilityDetail({
  params,
}: {
  params: Promise<{ tenantId: string; facilityId: string }>;
}) {
  const { tenantId, facilityId } = await params;
  const tenant = await getTenantById(tenantId);

  if (!tenant) {
    redirect('/');
  }

  const session = await getServerSession(authOptions);
  const membership = session?.user
    ? await getMembershipForUserInTenant(session.user.id, tenant.id)
    : null;

  const facility = await getFacilityById(tenant.id, facilityId, membership?.status === 'APPROVED');

  if (!facility) {
    redirect(`/tenants/${tenant.id}/facilities`);
  }

  const serializable: Facility & { bookings?: FacilityBooking[]; blackouts?: FacilityBlackout[] } = {
    ...facility,
    createdAt: facility.createdAt.toISOString(),
    updatedAt: facility.updatedAt.toISOString(),
    bookingRules: (facility.bookingRules as Record<string, any> | null) ?? null,
    bookings: (facility.bookings ?? []).map((booking) => ({
      ...booking,
      startAt: booking.startAt.toISOString(),
      endAt: booking.endAt.toISOString(),
      createdAt: booking.createdAt.toISOString(),
    })),
    blackouts: (facility.blackouts ?? []).map((blackout) => ({
      ...blackout,
      startAt: blackout.startAt.toISOString(),
      endAt: blackout.endAt.toISOString(),
      createdAt: blackout.createdAt.toISOString(),
    })),
  };

  return <FacilityDetailPage tenantId={tenant.id} facility={serializable} isMember={membership?.status === 'APPROVED'} />;
}
