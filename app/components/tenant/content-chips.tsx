"use client"

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type ContentKey = 'Photos' | 'Podcasts' | 'Talks' | 'Books' | 'Live Stream' | string;

export default function ContentChips({ tenantId, active }: { tenantId: string; active?: ContentKey }) {
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const pathname = usePathname();

  // If TenantNav is already rendering the content submenu for this tenant
  // (e.g. when viewing `/tenants/:id/photos`, `/podcasts`, `/talks`, `/books`, `/livestream` or `/content`)
  // don't render the fixed chips to avoid a duplicate menu.
  const contentPaths = ['/photos', '/podcasts', '/talks', '/books', '/livestream', '/content'];
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

  // Publish the spacer height globally so layout can account for it when calculating
  // how much top padding the main content needs to leave so the subheader spacing
  // ends up as a thin gap (15px) below the subheader.
  useEffect(() => {
    // The spacer rendered below is `h-14` (56px). Publish that value so layouts
    // can subtract it when appropriate. Only set when the chips are visible.
    if (!isTenantContentRoute) {
      try {
        document.documentElement.style.setProperty('--content-chips-spacer', '56px');
      } catch (e) {
        // ignore (server-side or restricted environments)
      }
      return () => {
        try {
          document.documentElement.style.removeProperty('--content-chips-spacer');
        } catch (e) {
          // ignore
        }
      };
    }
    return;
  }, [isTenantContentRoute]);

  const chips: Array<{ href: string; label: ContentKey; feature?: string }> = [
    { href: `/tenants/${tenantId}/photos`, label: 'Photos', feature: 'enablePhotos' },
    { href: `/tenants/${tenantId}/podcasts`, label: 'Podcasts', feature: 'enablePodcasts' },
    { href: `/tenants/${tenantId}/talks`, label: 'Talks', feature: 'enableTalks' },
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
                    className={`menu-chip ${active === c.label ? 'menu-chip--active' : ''}`}
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

