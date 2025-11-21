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
            <div className="flex items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Your tenants</h2>
                <p className="text-sm text-slate-600">Quickly re-open tenants where you already have membership.</p>
              </div>
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

      {/* 'All tenants' section removed per design; tenants list not displayed below. */}
    </div>
  );
}
