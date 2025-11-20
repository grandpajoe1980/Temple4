import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getEventsForTenant, getPostsForTenant, getMembershipForUserInTenant } from '@/lib/data';
import HomePageClient from '@/app/components/tenant/HomePageClient'; // This will be the client component

export default async function TenantHomePage({ params }: { params: Promise<{ tenantId: string }> }) {
  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);
  
  if (!tenant) {
    redirect('/');
  }

  const session = await getServerSession(authOptions);
  let user = null;
  let membership = null;

  if (session && session.user) {
    user = await getUserById((session.user as any).id);
    if (user) {
      membership = await getMembershipForUserInTenant(user.id, tenant.id);
    }
  }

  // If not public and not logged in, redirect (layout handles this too, but good for safety)
  if (!tenant.settings?.isPublic && !user) {
    redirect(`/auth/login?callbackUrl=/tenants/${tenant.id}`);
  }

  const upcomingEvents = await getEventsForTenant(tenant.id, user.id);
  const recentPosts = await getPostsForTenant(tenant.id);

  return (
    <HomePageClient
      tenant={tenant}
      user={user}
      membership={membership}
      upcomingEvents={upcomingEvents.filter((e: any) => e.startDateTime > new Date()).slice(0, 3)}
      recentPosts={recentPosts.slice(0, 3)}
    />
  );
}
