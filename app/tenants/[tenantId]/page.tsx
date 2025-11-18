import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getEventsForTenant, getPostsForTenant, getMembershipForUserInTenant } from '@/lib/data';
import HomePageClient from '@/app/components/tenant/HomePageClient'; // This will be the client component

export default async function TenantHomePage({ params }: { params: Promise<{ tenantId: string }> }) {
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

  const membership = await getMembershipForUserInTenant(user.id, tenant.id);
  const upcomingEvents = await getEventsForTenant(tenant.id);
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
