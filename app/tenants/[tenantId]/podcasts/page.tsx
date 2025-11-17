import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getPodcastsForTenant } from '@/lib/data';
import { can } from '@/lib/permissions';
import PodcastsPage from '@/app/components/tenant/PodcastsPage';

export default async function TenantPodcastsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);
  const user = await getUserById((session.user as any).id);

  if (!tenant || !user) {
    redirect('/');
  }

  const podcasts = await getPodcastsForTenant(tenant.id);
  const canCreate = await can(user as any, tenant as any, 'canCreatePodcasts');

  return <PodcastsPage tenant={tenant} user={user} podcasts={podcasts} canCreate={canCreate} />;
}
