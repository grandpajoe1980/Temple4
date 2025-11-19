import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getFacilitiesForTenant, getMembershipForUserInTenant, getTenantById } from '@/lib/data';
import FacilitiesPage from '@/app/components/tenant/FacilitiesPage';

export default async function TenantFacilitiesPage({ params }: { params: { tenantId: string } }) {
  const { tenantId } = params;
  const tenant = await getTenantById(tenantId);

  if (!tenant) {
    redirect('/');
  }

  const session = await getServerSession(authOptions);
  const membership = session?.user
    ? await getMembershipForUserInTenant((session.user as any).id, tenant.id)
    : null;

  const facilities = await getFacilitiesForTenant(tenant.id, { includeInactive: membership?.status === 'APPROVED' });
  const serializable = facilities.map((facility) => ({
    ...facility,
    createdAt: facility.createdAt.toISOString(),
    updatedAt: facility.updatedAt.toISOString(),
  }));

  return (
    <FacilitiesPage tenant={{ id: tenant.id, name: tenant.name }} facilities={serializable as any} isMember={membership?.status === 'APPROVED'} />
  );
}
