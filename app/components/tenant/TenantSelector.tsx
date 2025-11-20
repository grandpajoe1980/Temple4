"use client";

import React, { useMemo, useState } from 'react';
import type { TenantSettings } from '@/types';
import type { TenantWithRelations } from '@/lib/data';
import Button from '../ui/Button';

interface TenantSelectorProps {
  tenants: TenantWithRelations[];
  onSelect: (tenantId: string) => void;
  onCreateNew: () => void;
}

type FeatureKey = keyof Pick<
  TenantSettings,
  | 'enableCalendar'
  | 'enableGroupChat'
  | 'enableDonations'
  | 'enableVolunteering'
  | 'enableSmallGroups'
  | 'enableLiveStream'
>;

const featureMap: Record<FeatureKey, string> = {
  enableCalendar: 'Events',
  enableGroupChat: 'Chat',
  enableDonations: 'Donations',
  enableVolunteering: 'Volunteers',
  enableSmallGroups: 'Small Groups',
  enableLiveStream: 'Live Stream',
};

const TenantSelector: React.FC<TenantSelectorProps> = ({ tenants, onSelect, onCreateNew }) => {
  const [query, setQuery] = useState('');

  const filteredTenants = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return tenants
      .filter((tenant) => {
        if (!lowerQuery) return true;
        const safeAddress = tenant.address ?? {
          street: tenant.street,
          city: tenant.city,
          state: tenant.state,
          country: tenant.country,
          postalCode: tenant.postalCode,
        };
        const searchBlob = [tenant.name, tenant.creed, safeAddress?.city, safeAddress?.state, safeAddress?.country]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchBlob.includes(lowerQuery);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tenants, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Select a tenant</h2>
          <p className="text-sm text-slate-500">Search the full network or spin up a new spiritual home.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="currentColor" d="M11 3a8 8 0 0 1 6.2 13.2l4.3 4.3-1.4 1.4-4.3-4.3A8 8 0 1 1 11 3m0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" />
              </svg>
            </span>
            <input
              type="search"
              aria-label="Filter tenants"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/80 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              placeholder="Search name, creed, or city"
            />
          </div>
          <Button onClick={onCreateNew} className="rounded-xl text-sm">
            + Create new temple
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTenants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
            No temples match that search yet. Try another phrase or create a new tenant.
          </div>
        ) : (
          filteredTenants.map((tenant) => {
            const safeAddress = tenant.address ?? {
              street: tenant.street,
              city: tenant.city,
              state: tenant.state,
              country: tenant.country,
              postalCode: tenant.postalCode,
            };
            const tenantSettings = tenant?.settings ?? null;
            const activeFeatures = Object.entries(featureMap)
              .filter(([key]) => Boolean(tenantSettings?.[key as FeatureKey]))
              .map(([, label]) => label)
              .slice(0, 3);
            const isPublic = tenantSettings?.isPublic ?? false;

            return (
              <button
                key={tenant.id}
                onClick={() => onSelect(tenant.id)}
                className="group w-full rounded-2xl border border-white/70 bg-white/90 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-xl"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">{tenant.name}</h3>
                      <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700">
                        {isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {tenant.creed}
                      {safeAddress?.city || safeAddress?.state ? (
                        <>
                          {' '}
                          · {(safeAddress?.city ?? 'Unknown City')}, {(safeAddress?.state ?? 'Unknown State')}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Tap to open</span>
                </div>
                {tenant.description ? (
                  <p className="mt-2 text-sm text-slate-600" style={{ WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', display: '-webkit-box', overflow: 'hidden' }}>
                    {tenant.description}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeFeatures.length ? (
                    activeFeatures.map((label) => (
                      <span
                        key={label}
                        className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                      >
                        {label}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Feature toggles coming soon</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TenantSelector;
