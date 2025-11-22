import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getMembersForTenant } from '@/lib/data';
import TenantStaffPageClient from './TenantStaffPageClient';

export default async function TenantStaffPage({ params }: { params: Promise<{ tenantId: string }> }) {
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

  // Filter to staff, clergy, or admin roles
  const staff = members.filter((m) =>
    (m.membership.roles || []).some((r: any) => ['STAFF', 'CLERGY', 'ADMIN'].includes(r.role))
  );

  return <TenantStaffPageClient tenant={tenant} user={user} members={staff} />;
}
