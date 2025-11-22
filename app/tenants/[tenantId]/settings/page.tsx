import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById } from '@/lib/data';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import TenantSettingsClient from './TenantSettingsClient';

export default async function TenantSettingsPage({ params }: { params: Promise<{ tenantId: string }> }) {
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

  // Check if user has admin access
  const isAdmin = user.isSuperAdmin || await hasRole(user.id, tenant.id, [TenantRole.ADMIN]);
  
  if (!isAdmin) {
    redirect(`/tenants/${tenant.id}`);
  }

  return (
    <TenantSettingsClient
      tenant={tenant}
      user={user}
    />
  );
}
