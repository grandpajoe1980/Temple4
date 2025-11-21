import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getPhotosForTenant, getMembershipForUserInTenant } from '@/lib/data';
import { can } from '@/lib/permissions';
import PhotosPage from '@/app/components/tenant/PhotosPage';

export default async function TenantPhotosPage({ params }: { params: Promise<{ tenantId: string }> }) {
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

  const photos = await getPhotosForTenant(tenant.id);
  const canCreate = await can(user, tenant, 'canCreatePosts');

  // Determine if the current user is a tenant ADMIN or a platform super admin
  const membership = await getMembershipForUserInTenant(user.id, tenant.id);
  const isAdmin = Boolean((user as any)?.isSuperAdmin || membership?.roles?.some((r: any) => r.role === 'ADMIN'));

  return <PhotosPage tenant={tenant} user={user} initialPhotos={photos} canCreate={canCreate} isAdmin={isAdmin} />;
}
