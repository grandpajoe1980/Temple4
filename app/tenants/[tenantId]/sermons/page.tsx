import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getSermonsForTenant } from '@/lib/data';
import { can } from '@/lib/permissions';
import SermonsPage from '@/app/components/tenant/SermonsPage';

export default async function TenantSermonsPage({ params }: { params: Promise<{ tenantId: string }> }) {
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

  const sermons = await getSermonsForTenant(tenant.id);
  const canCreate = await can(user as any, tenant as any, 'canCreateSermons');

  return <SermonsPage tenant={tenant} user={user} sermons={sermons} canCreate={canCreate} />;
}
