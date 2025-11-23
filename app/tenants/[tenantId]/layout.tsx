import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById } from '@/lib/data';
import { hasRole, can } from '@/lib/permissions';
import { TenantRole } from '@/types';
// TenantNav removed — navigation moved into the hamburger menu
import TenantFooter from './TenantFooter';

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const tenant = await getTenantById(tenantId);
  
  if (!tenant) {
    redirect('/');
  }

  const session = await getServerSession(authOptions);
  let user = null;

  if (session && session.user) {
    user = await getUserById(session.user.id);
  }

  // If not public and not logged in (or user not found), redirect to login
  if (!tenant.settings?.isPublic && !user) {
    redirect(`/auth/login?callbackUrl=/tenants/${tenant.id}`);
  }

  const canViewSettings = user ? (
    user.isSuperAdmin || 
    await hasRole(user.id, tenant.id, [TenantRole.ADMIN]) ||
    await can(user, tenant, 'canApproveMembership') ||
    await can(user, tenant, 'canBanMembers') ||
    await can(user, tenant, 'canManagePrayerWall') ||
    await can(user, tenant, 'canManageResources') ||
    await can(user, tenant, 'canManageContactSubmissions')
  ) : false;

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-3">
              {/* Tenant navigation removed; links available in tenant hamburger */}
            </div>
        </div>
      </header>
      <main className="py-10 flex-grow">
        <div suppressHydrationWarning className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <TenantFooter tenant={tenant} />
    </div>
  );
}
