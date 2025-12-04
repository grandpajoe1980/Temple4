import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getTripsForTenant, getMembershipForUserInTenant } from '@/lib/data';
import TripsClient from './TripsClient';

export default async function TenantTripsPage({ params }: { params: Promise<{ tenantId: string }> }) {
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

  if (!tenant.settings?.enableTrips) {
    redirect(`/tenants/${tenant.id}`);
  }

  const trips = await getTripsForTenant(tenant.id);
  const membership = await getMembershipForUserInTenant(user.id, tenant.id);
  const membershipRoles = membership?.roles?.map((r: any) => r.role) || [];
  const isPlatformAdmin = Boolean((session.user as any)?.isSuperAdmin);
  const isAdmin =
    isPlatformAdmin ||
    membershipRoles.some((role: string) => ['ADMIN', 'OWNER', 'STAFF', 'LEADER'].includes(role));

  let visibleTrips = trips;
  if (!isAdmin && !isPlatformAdmin) {
    visibleTrips = (trips as any[]).filter((t: any) => {
      if (!t.isHidden) return true;
      if (t.leaderUserId === user.id || t.coLeaderUserId === user.id) return true;
      if (t.members && t.members.some((m: any) => m.user?.id === user.id)) return true;
      return false;
    });
  }

  return <TripsClient tenant={tenant} user={user} trips={visibleTrips as any} isAdmin={isAdmin} />;
}
