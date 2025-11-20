import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getMembershipForUserInTenant, getServiceOfferingById } from '@/lib/data';
import ServiceDetailPage from '@/app/components/tenant/ServiceDetailPage';

export default async function TenantServiceDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string; serviceId: string }>;
}) {
  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);

  if (!tenant) {
    redirect('/');
  }

  const session = await getServerSession(authOptions);
  const membership = session?.user
    ? await getMembershipForUserInTenant(session.user.id, tenant.id)
    : null;

  const includePrivate = membership?.status === 'APPROVED';
  const service = await getServiceOfferingById(tenant.id, resolvedParams.serviceId, includePrivate);

  if (!service) {
    redirect(`/tenants/${tenant.id}/services`);
  }

  const serializableService = {
    ...service,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };

  return (
    <ServiceDetailPage
      tenant={{ id: tenant.id, name: tenant.name, contactEmail: tenant.contactEmail }}
      service={serializableService}
    />
  );
}
