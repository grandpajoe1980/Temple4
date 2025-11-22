import { redirect } from 'next/navigation';

export default async function TenantFacilitiesPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;

  // Redirect the old facilities listing route to the Services page with the
  // FACILITY category so the UI is contained on `/tenants/[tenantId]/services`.
  redirect(`/tenants/${tenantId}/services?category=FACILITY`);
}
