import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getMembershipForUserInTenant, getServiceOfferingsForTenant, getFacilitiesForTenant } from '@/lib/data';
import ServicesPage from '@/app/components/tenant/ServicesPage';
import type { ServiceCategory } from '@/types';

export default async function TenantServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams?: Promise<{ category?: string }>;
}) {
  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);

  if (!tenant) {
    redirect('/');
  }

  const resolvedSearch = searchParams ? await searchParams : {};
  const requestedCategory = typeof resolvedSearch.category === 'string' ? resolvedSearch.category : undefined;

  const session = await getServerSession(authOptions);
  const membership = session?.user
    ? await getMembershipForUserInTenant(session.user.id, tenant.id)
    : null;

  const includePrivate = membership?.status === 'APPROVED';
  const validCategories: ServiceCategory[] = ['CEREMONY', 'EDUCATION', 'FACILITY', 'COUNSELING', 'OTHER'];
  const selectedCategory = requestedCategory && validCategories.includes(requestedCategory as ServiceCategory)
    ? (requestedCategory as ServiceCategory)
    : undefined;

  const services = await getServiceOfferingsForTenant(tenant.id, {
    includePrivate,
    category: selectedCategory,
  });

  // If the user requested the FACILITY category, fetch facilities and pass
  // them into the ServicesPage so the category chips remain visible and the
  // UI stays contained on `/tenants/[tenantId]/services`.
  if (selectedCategory === 'FACILITY') {
    const facilities = await getFacilitiesForTenant(tenant.id, { includeInactive: includePrivate });
    const serializableFacilities = facilities.map((facility) => ({
      ...facility,
      createdAt: facility.createdAt.toISOString(),
      updatedAt: facility.updatedAt.toISOString(),
    }));

    // Render ServicesPage with facilities prop set and an empty services list.
    return (
      <ServicesPage
        tenant={{ id: tenant.id, name: tenant.name }}
        services={[]}
        selectedCategory={selectedCategory}
        isMember={includePrivate}
        facilities={serializableFacilities}
      />
    );
  }

  const serializableServices = services.map((service) => ({
    ...service,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  }));

  return (
    <ServicesPage
      tenant={{ id: tenant.id, name: tenant.name }}
      services={serializableServices}
      selectedCategory={selectedCategory}
      isMember={includePrivate}
      showChips={Boolean(tenant.settings?.enableServices)}
    />
  );
}
