import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById } from '@/lib/data';
import ContactPage from '@/app/components/tenant/ContactPage';

export default async function TenantContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams?: Promise<{ service?: string }>;
}) {
  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);

  const resolvedSearch = searchParams ? await searchParams : {};
  const initialServiceName = typeof resolvedSearch.service === 'string' ? resolvedSearch.service : undefined;

  if (!tenant) {
    redirect('/');
  }

  const session = await getServerSession(authOptions);

  if (!tenant.settings?.isPublic && !session?.user) {
    redirect(`/auth/login?callbackUrl=/tenants/${tenant.id}/contact`);
  }

  return <ContactPage tenant={tenant} initialServiceName={initialServiceName} />;
}
