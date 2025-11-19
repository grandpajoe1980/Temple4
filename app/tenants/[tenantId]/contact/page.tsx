import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById } from '@/lib/data';
import ContactPage from '@/app/components/tenant/ContactPage';

export default async function TenantContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams?: Promise<{ service?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);
  const user = await getUserById((session.user as any).id);

  const resolvedSearch = searchParams ? await searchParams : {};
  const initialServiceName = typeof resolvedSearch.service === 'string' ? resolvedSearch.service : undefined;

  if (!tenant || !user) {
    redirect('/');
  }

  return <ContactPage tenant={tenant} initialServiceName={initialServiceName} />;
}
