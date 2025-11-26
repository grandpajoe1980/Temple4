import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById } from '@/lib/data';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { listTenantProfilePosts } from '@/lib/services/profile-post-service';
import TenantWallClient from '@/app/components/tenant/TenantWallClient';
import WallCreateButton from '@/app/components/tenant/WallCreateButton';
import CommunityChips from '@/app/components/tenant/CommunityChips';
import CommunityHeader from '@/app/components/tenant/CommunityHeader';

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

  const canModerate = await hasRole(user.id, tenant.id, [TenantRole.ADMIN, TenantRole.STAFF, TenantRole.CLERGY, TenantRole.MODERATOR]);

  // The client component expects a simple shape; profile-post-service returns DTOs compatible enough
  return (
    <div className="space-y-8">
      <CommunityChips tenantId={tenant.id} />

      <CommunityHeader
        title={<>Wall</>}
        subtitle={<>Public posts from members of this tenant. Comment and interact with the community.</>}
        actions={<WallCreateButton userId={user.id} tenantId={tenant.id} />}
      />

      <TenantWallClient tenantId={tenant.id} initialPosts={posts} showCreateButton={false} canModerate={canModerate} />
    </div>
  );
}
