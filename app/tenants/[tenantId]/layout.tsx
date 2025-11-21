import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById } from '@/lib/data';
import { hasRole, can } from '@/lib/permissions';
import {  } from '@prisma/client';
import { TenantRole } from '@/types';
import Link from 'next/link';
import TenantNav from './TenantNav'; // This will be the client component for navigation
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
            <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                   <div className="flex items-center space-x-4">
                      {/* left intentionally blank - SiteHeader shows tenant menu in logo spot */}
                    </div>
                 <div className="flex flex-col items-start gap-2 sm:items-end">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        {user ? (
                          <>
                            <div className="flex items-center space-x-2">
                                <img src={user.profile?.avatarUrl || ''} alt={user.profile?.displayName} className="h-8 w-8 rounded-full"/>
                                <p className="font-semibold text-amber-700 text-sm hidden sm:block">{user.profile?.displayName}</p>
                            </div>
                          </>
                        ) : (
                          <Link href={`/auth/login?callbackUrl=/tenants/${tenant.id}`} className="text-sm font-medium text-amber-600 hover:text-amber-700">
                            Login / Join
                          </Link>
                        )}
                    </div>
                    {user && (
                      <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-600">
                        {/* Tenant-level quick links removed per design */}
                      </div>
                    )}
                 </div>
            </div>
            <TenantNav tenant={tenant} canViewSettings={canViewSettings} />
        </div>
      </header>
       <main className="py-10 flex-grow">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <TenantFooter tenant={tenant} />
    </div>
  );
}
