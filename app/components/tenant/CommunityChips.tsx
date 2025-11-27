"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type TenantSettingsLike = Record<string, any> | null;

export default function CommunityChips({ tenantId }: { tenantId: string }) {
  const base = `/tenants/${tenantId}`;
  const [settings, setSettings] = useState<TenantSettingsLike>(null);
  const pathname = usePathname();

  // Hide these chips when TenantNav is already showing the community submenu
  const communityPaths = [
    '/community',
    '/posts',
    '/community/wall',
    '/calendar',
    '/prayer-wall',
    '/members',
    '/staff',
    '/chat',
    '/small-groups',
    '/trips',
    '/volunteering',
    '/resources',
  ];
  const isTenantCommunityRoute = Boolean(pathname && communityPaths.some((p) => pathname.startsWith(`${base}${p}`)));

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

  const items: Array<{ key: string; label: string; path: string; feature?: string }> = [
    { key: 'posts', label: 'Posts', path: '/posts', feature: 'enablePosts' },
    { key: 'wall', label: 'Wall', path: '/community/wall' },
    { key: 'calendar', label: 'Calendar', path: '/calendar', feature: 'enableCalendar' },
    { key: 'prayerWall', label: 'Prayer Wall', path: '/prayer-wall', feature: 'enablePrayerWall' },
    { key: 'members', label: 'Members', path: '/members', feature: 'enableMemberDirectory' },
  { key: 'staff', label: 'Staff', path: '/staff', feature: 'enableMemberDirectory' },
    { key: 'chat', label: 'Chat', path: '/chat', feature: 'enableGroupChat' },
    { key: 'smallGroups', label: 'Small Groups', path: '/small-groups', feature: 'enableSmallGroups' },
    { key: 'trips', label: 'Trips', path: '/trips', feature: 'enableTrips' },
    { key: 'volunteering', label: 'Volunteering', path: '/volunteering', feature: 'enableVolunteering' },
    { key: 'resourceCenter', label: 'Resource', path: '/resources', feature: 'enableResourceCenter' },
  ];

  return (
    isTenantCommunityRoute ? null : (
    <>
      <div className="sticky z-10 -mx-4 sm:-mx-6 lg:-mx-8" style={{ top: 'var(--site-header-height)' }}>
        <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap gap-3">
            {items.map((it) => {
              const enabled = !it.feature || Boolean(settings?.[it.feature]);
              if (!enabled) return null;
              return (
                <Link
                  key={it.key}
                  href={`${base}${it.path}`}
                  className="rounded-full border px-4 py-2 text-sm transition-colors border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700"
                >
                  {it.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
    )
  );
}
