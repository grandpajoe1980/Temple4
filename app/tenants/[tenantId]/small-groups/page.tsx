import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getSmallGroupsForTenant, getMembershipForUserInTenant } from '@/lib/data';
import SmallGroupsClient from './SmallGroupsClient';

export default async function TenantSmallGroupsPage({ params }: { params: Promise<{ tenantId: string }> }) {
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

  const groups = await getSmallGroupsForTenant(tenant.id);
  const membership = await getMembershipForUserInTenant(user.id, tenant.id);
  const isAdmin = !!(membership && membership.roles && membership.roles.some((r: any) => r.role === 'ADMIN' || r.role === 'OWNER'));

  // Enforce visibility rules on server-rendered page as well: non-admin tenant members
  // should not see groups marked as hidden unless they are the leader or a member.
  let visibleGroups = groups;
  if (!isAdmin && !(session.user as any)?.isSuperAdmin) {
    visibleGroups = (groups as any[]).filter((g: any) => {
      if (!g.isHidden) return true;
      if (g.leaderUserId === user.id) return true;
      if (g.members && g.members.some((m: any) => m.id === user.id)) return true;
      return false;
    });
  }

  return <SmallGroupsClient tenant={tenant} user={user} groups={visibleGroups} isAdmin={isAdmin} />;
}
