"use client";

import React, { useMemo, useState } from 'react';
import type { TenantSettings } from '@/types';
import type { TenantWithRelations } from '@/lib/data';
import Button from '../ui/Button';
import useTranslation from '@/app/hooks/useTranslation';

interface TenantSelectorProps {
  tenants: TenantWithRelations[];
  onSelect: (tenantId: string) => void;
  onCreateNew: () => void;
  showHeader?: boolean;
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

const TenantSelector: React.FC<TenantSelectorProps> = ({ tenants, onSelect, onCreateNew, showHeader = true }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const featureLabels: Record<FeatureKey, string> = {
    enableCalendar: t('features.events'),
    enableGroupChat: t('features.chat'),
    enableDonations: t('features.donations'),
    enableVolunteering: t('features.volunteers'),
    enableSmallGroups: t('features.smallGroups'),
    enableLiveStream: t('features.liveStream'),
  };

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
      {showHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{t('tenantSelector.selectTenant')}</h2>
            <p className="text-sm text-muted-foreground">{t('tenantSelector.searchDescription')}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="currentColor" d="M11 3a8 8 0 0 1 6.2 13.2l4.3 4.3-1.4 1.4-4.3-4.3A8 8 0 1 1 11 3m0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" />
                </svg>
              </span>
              <input
                type="search"
                aria-label={t('tenantSelector.filterTenants')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-xl border border-border bg-card/80 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={t('tenantSelector.searchPlaceholder')}
              />
            </div>
            <Button onClick={onCreateNew} className="rounded-xl text-sm">
              {t('tenantSelector.createNewCommunity')}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredTenants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/70 p-6 text-center text-sm text-muted-foreground">
            {t('tenantSelector.noMatchingCommunities')}
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
            const activeFeatures = Object.entries(featureLabels)
              .filter(([key]) => Boolean(tenantSettings?.[key as FeatureKey]))
              .map(([, label]) => label)
              .slice(0, 3);
            const isPublic = tenantSettings?.isPublic ?? false;

            return (
              <button
                key={tenant.id}
                onClick={() => onSelect(tenant.id)}
                className="group w-full rounded-2xl border border-border/70 bg-card/90 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-xl"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">{tenant.name}</h3>
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        {isPublic ? t('common.public') : t('common.private')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tenant.creed}
                      {safeAddress?.city || safeAddress?.state ? (
                        <>
                          {' '}
                          · {(safeAddress?.city ?? 'Unknown City')}, {(safeAddress?.state ?? 'Unknown State')}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('tenantSelector.tapToOpen')}</span>
                </div>
                {tenant.description ? (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {tenant.description}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeFeatures.length ? (
                    activeFeatures.map((label) => (
                      <span
                        key={label}
                        className="rounded-full tenant-bg-50 px-3 py-1 text-xs font-medium tenant-text-primary"
                      >
                        {label}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('tenantSelector.featuresSoon')}</span>
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
