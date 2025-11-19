import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getFacilityById, getMembershipForUserInTenant, getTenantById } from '@/lib/data';
import FacilityDetailPage from '@/app/components/tenant/FacilityDetailPage';

export default async function FacilityDetail({
  params,
}: {
  params: { tenantId: string; facilityId: string };
}) {
  const { tenantId, facilityId } = params;
  const tenant = await getTenantById(tenantId);

  if (!tenant) {
    redirect('/');
  }

  const session = await getServerSession(authOptions);
  const membership = session?.user
    ? await getMembershipForUserInTenant((session.user as any).id, tenant.id)
    : null;

  const facility = await getFacilityById(tenant.id, facilityId, membership?.status === 'APPROVED');

  if (!facility) {
    redirect(`/tenants/${tenant.id}/facilities`);
  }

  const serializable = {
    ...facility,
    createdAt: facility.createdAt.toISOString(),
    updatedAt: facility.updatedAt.toISOString(),
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

  return <FacilityDetailPage tenantId={tenant.id} facility={serializable as any} isMember={membership?.status === 'APPROVED'} />;
}
