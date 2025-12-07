import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById } from '@/lib/data';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { listTenantProfilePosts } from '@/lib/services/profile-post-service';
import WallPageClient from './WallPageClient';

export default async function TenantWallPage({ params }: { params: Promise<{ tenantId: string }> }) {
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

  const { posts } = await listTenantProfilePosts(tenant.id, user.id, { page: 1, limit: 50 });

  const canModerate = await hasRole(user.id, tenant.id, [TenantRole.ADMIN, TenantRole.STAFF, TenantRole.LEADER, TenantRole.MODERATOR]);

  return (
    <WallPageClient
      tenantId={tenant.id}
      userId={user.id}
      initialPosts={posts}
      canModerate={canModerate}
    />
  );
}
