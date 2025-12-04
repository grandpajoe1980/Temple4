import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getTalksForTenant } from '@/lib/data';
import { can } from '@/lib/permissions';
import TalksPage from '@/app/components/tenant/SermonsPage';

export default async function TenantTalksPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);
  const user = await getUserById(session.user.id);

  if (!tenant || !user) {
    redirect('/');
  }

  const talks = await getTalksForTenant(tenant.id);
  const canCreate = await can(user, tenant, 'canCreateTalks');

  return <TalksPage tenant={tenant} user={user} talks={talks} canCreate={canCreate} />;
}
