import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getSmallGroupsForTenant } from '@/lib/data';
import SmallGroupsClient from './SmallGroupsClient';

export default async function TenantSmallGroupsPage({ params }: { params: Promise<{ tenantId: string }> }) {
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

  const groups = await getSmallGroupsForTenant(tenant.id);

  return <SmallGroupsClient tenant={tenant} user={user} groups={groups} />;
}
