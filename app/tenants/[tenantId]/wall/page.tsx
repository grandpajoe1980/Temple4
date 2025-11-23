import { redirect } from 'next/navigation';

export default async function TenantWallRedirect({ params }: { params: Promise<{ tenantId: string }> }) {
  const resolved = await params;
  const tenantId = resolved.tenantId;
  redirect(`/tenants/${tenantId}/community/wall`);
}
