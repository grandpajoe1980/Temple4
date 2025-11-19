"use client";

import { useRouter } from 'next/navigation';
import TenantSelector from '../components/tenant/TenantSelector';
import Button from '../components/ui/Button';
import type { Tenant } from '@/types';

interface TenantsPageClientProps {
  isAuthenticated: boolean;
  memberTenants: Tenant[];
  allTenants: Tenant[];
}

export default function TenantsPageClient({ isAuthenticated, memberTenants, allTenants }: TenantsPageClientProps) {
  const router = useRouter();
  const handleSelect = (tenantId: string) => router.push(`/tenants/${tenantId}`);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10">
      <div className="rounded-3xl bg-white/80 p-8 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Tenant switcher</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Choose where to work</h1>
            <p className="mt-1 text-sm text-slate-600">
              Jump to an existing tenant, keep exploring, or start something new.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push('/explore')} size="sm">
              Explore tenants
            </Button>
            <Button onClick={() => router.push('/tenants/new')} size="sm">
              Create tenant
            </Button>
          </div>
        </div>
      </div>

      {isAuthenticated ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Your tenants</h2>
              <p className="text-sm text-slate-600">Quickly re-open tenants where you already have membership.</p>
            </div>
            <Button variant="ghost" onClick={() => router.push('/messages')} size="sm">
              Open global messages
            </Button>
          </div>
          {memberTenants.length ? (
            <TenantSelector tenants={memberTenants} onSelect={handleSelect} onCreateNew={() => router.push('/tenants/new')} />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-600">
              You are not a member of any tenants yet. Use Explore to browse communities or create a new one.
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Signed-out preview</h2>
          <p className="text-sm text-slate-600">
            Browse public tenants or log in to see the communities you belong to.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => router.push('/auth/login')} size="sm">
              Log in
            </Button>
            <Button variant="ghost" onClick={() => router.push('/auth/register')} size="sm">
              Create account
            </Button>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-slate-900">All tenants</h2>
          <p className="text-sm text-slate-600">Search the full directory. Public tenants open immediately.</p>
        </div>
        <TenantSelector tenants={allTenants} onSelect={handleSelect} onCreateNew={() => router.push('/tenants/new')} />
      </section>
    </div>
  );
}
