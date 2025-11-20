import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getPostsForTenant } from '@/lib/data';
import { can } from '@/lib/permissions';
import PostsPage from '@/app/components/tenant/PostsPage';

export default async function TenantPostsPage({ params }: { params: Promise<{ tenantId: string }> }) {
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

  const posts = await getPostsForTenant(tenant.id);
  const canCreate = await can(user, tenant, 'canCreatePosts');

  return <PostsPage tenant={tenant} user={user} posts={posts} canCreate={canCreate} />;
}
