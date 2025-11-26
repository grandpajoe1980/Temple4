"use client"

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type ContentKey = 'Photos' | 'Podcasts' | 'Sermons' | 'Books' | 'Live Stream' | string;

export default function ContentChips({ tenantId, active }: { tenantId: string; active?: ContentKey }) {
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const pathname = usePathname();

  // If TenantNav is already rendering the content submenu for this tenant
  // (e.g. when viewing `/tenants/:id/photos`, `/podcasts`, `/sermons`, `/books`, `/livestream` or `/content`)
  // don't render the fixed chips to avoid a duplicate menu.
  const contentPaths = ['/photos', '/podcasts', '/sermons', '/books', '/livestream', '/content'];
  const base = `/tenants/${tenantId}`;
  const isTenantContentRoute = Boolean(pathname && contentPaths.some((p) => pathname.startsWith(`${base}${p}`)));

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/tenants/${tenantId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setSettings(data?.settings || {});
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [tenantId]);

  const chips: Array<{ href: string; label: ContentKey; feature?: string }> = [
    { href: `/tenants/${tenantId}/photos`, label: 'Photos', feature: 'enablePhotos' },
    { href: `/tenants/${tenantId}/podcasts`, label: 'Podcasts', feature: 'enablePodcasts' },
    { href: `/tenants/${tenantId}/sermons`, label: 'Sermons', feature: 'enableSermons' },
    { href: `/tenants/${tenantId}/books`, label: 'Books', feature: 'enableBooks' },
    { href: `/tenants/${tenantId}/livestream`, label: 'Live Stream', feature: 'enableLiveStream' },
  ];

  return (
    isTenantContentRoute ? null : (
      <>
        <div className="fixed top-16 left-0 right-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-wrap gap-3">
              {chips.map((c) => {
                const enabled = !c.feature || Boolean(settings?.[c.feature]);
                if (!enabled) return null;
                return (
                  <Link
                    key={c.href}
                    href={c.href}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${{
                      true: 'border-amber-500 bg-amber-100 text-amber-800',
                    }[String(active === c.label)] ?? 'border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700'}`}
                    aria-current={active === c.label ? 'page' : undefined}
                  >
                    {c.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        <div aria-hidden className="h-14" />
      </>
    )
  );
}
