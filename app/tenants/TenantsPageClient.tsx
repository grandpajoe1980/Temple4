"use client";

import { useRouter } from 'next/navigation';
import TenantSelector from '../components/tenant/TenantSelector';
import Button from '../components/ui/Button';
import type { Prisma } from '@prisma/client';

type TenantWithRelations = Prisma.TenantGetPayload<{
  include: { settings: true; branding: true };
}>;

interface TenantsPageClientProps {
  isAuthenticated: boolean;
  memberTenants: TenantWithRelations[];
  allTenants: TenantWithRelations[];
}

export default function TenantsPageClient({ isAuthenticated, memberTenants, allTenants }: TenantsPageClientProps) {
  const router = useRouter();
  const handleSelect = (tenantId: string) => router.push(`/tenants/${tenantId}`);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10">

      {isAuthenticated && (
        memberTenants.length ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Your tenants</h2>
                <p className="text-sm text-slate-600">Quickly re-open tenants where you already have membership.</p>
              </div>
              <Button onClick={() => router.push('/tenants/new')} variant="primary">
                Create Tenant
              </Button>
            </div>
            <TenantSelector tenants={memberTenants} onSelect={handleSelect} onCreateNew={() => router.push('/tenants/new')} showHeader={false} />
          </section>
        ) : (
          // If the user has no member tenants, show the full tenant selector (search + list)
          <section className="space-y-4">
            <TenantSelector tenants={allTenants} onSelect={handleSelect} onCreateNew={() => router.push('/tenants/new')} />
          </section>
        )
      )}

      {!isAuthenticated && (
        <section className="flex flex-col items-center justify-center gap-6 py-10 text-center">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Create your own community</h2>
            <p className="mt-2 text-slate-600 max-w-md">
              Start your own tenant on Asembli to manage events, donations, and more.
            </p>
          </div>
          <Button onClick={() => router.push('/tenants/new')} variant="primary">
            Create Tenant
          </Button>
          <div className="text-sm text-slate-500">
            Or <button onClick={() => router.push('/auth/login')} className="text-amber-600 underline">log in</button> to see your existing memberships.
          </div>
        </section>
      )}

      {/* 'All tenants' section removed per design; tenants list not displayed below. */}
    </div>
  );
}
