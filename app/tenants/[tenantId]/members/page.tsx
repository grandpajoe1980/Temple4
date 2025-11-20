import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getMembersForTenant } from '@/lib/data';
import TenantMembersPageClient from './TenantMembersPageClient';

export default async function TenantMembersPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);
  const user = await getUserById(session.user.id as string);

  if (!tenant || !user) {
    redirect('/');
  }

  const members = await getMembersForTenant(tenant.id);

  return <TenantMembersPageClient tenant={tenant} user={user} members={members} />;
}
