import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById } from '@/lib/data';
import { hasRole, can } from '@/lib/permissions';
import { TenantRole } from '@/types';
import TenantNav from './TenantNav';
import TenantFooter from './TenantFooter';
import TenantBrandingProvider from './TenantBrandingProvider';

// Enable ISR with revalidation for tenant pages
export const revalidate = 60; // Revalidate every 60 seconds

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
    <TenantBrandingProvider primaryColor={tenant.branding?.primaryColor} accentColor={tenant.branding?.accentColor}>
      <div className="bg-muted min-h-screen flex flex-col">
        {/* Header hidden on mobile - navigation handled by MobileNav in SiteHeader */}
        <header
          className="sticky z-30 bg-card shadow-sm hidden md:block"
          style={{
            top: 'calc(var(--site-header-height, 4.5rem) + var(--impersonation-banner-offset, 0px))',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-0">
              <TenantNav tenant={tenant} canViewSettings={canViewSettings} />
            </div>
          </div>
        </header>
        <main className="flex-grow pb-10" style={{ paddingTop: 'clamp(2px, 0.35vw, 6px)' }}>
          <div suppressHydrationWarning className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        <TenantFooter tenant={tenant} />
      </div>
    </TenantBrandingProvider>
  );
}
