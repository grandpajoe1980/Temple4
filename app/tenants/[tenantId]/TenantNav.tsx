"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Tenant, TenantSettings } from '@prisma/client';
import { CONTROL_PANEL_TABS } from '@/constants';

interface TenantNavProps {
  tenant: Tenant & { settings: TenantSettings | null };
  canViewSettings: boolean;
}

type TenantPage = 'home' | 'content' | 'community' | 'settings' | 'services' | 'donations' | 'contact';
type SubmenuKey = 'content' | 'community' | 'services' | 'settings';
type NavItemFeature = keyof Omit<
  TenantSettings,
  | 'id'
  | 'tenantId'
  | 'isPublic'
  | 'membershipApprovalMode'
  | 'visitorVisibility'
  | 'donationSettings'
  | 'liveStreamSettings'
>;

const navItems: { key: TenantPage; label: string; path: string; feature?: NavItemFeature; adminOnly?: boolean }[] = [
  { key: 'home', label: 'Home', path: '' },
  { key: 'content', label: 'Content', path: '/content' },
  { key: 'community', label: 'Community', path: '/community' },
  { key: 'services', label: 'Services', path: '/services', feature: 'enableServices' },
  { key: 'donations', label: 'Donations', path: '/donations', feature: 'enableDonations' },
  { key: 'contact', label: 'Contact Us', path: '/contact' },
  { key: 'settings', label: 'Settings', path: '/settings', adminOnly: true },
];

const contentSubItems: { key: string; label: string; path: string; feature?: NavItemFeature }[] = [
  { key: 'photos', label: 'Photos', path: '/photos', feature: 'enablePhotos' },
  { key: 'podcasts', label: 'Podcasts', path: '/podcasts', feature: 'enablePodcasts' },
  { key: 'sermons', label: 'Sermons', path: '/sermons', feature: 'enableSermons' },
  { key: 'books', label: 'Books', path: '/books', feature: 'enableBooks' },
  { key: 'liveStream', label: 'Live Stream', path: '/livestream', feature: 'enableLiveStream' },
];

const communitySubItems: { key: string; label: string; path: string; feature?: NavItemFeature }[] = [
  { key: 'posts', label: 'Posts', path: '/posts', feature: 'enablePosts' },
  { key: 'wall', label: 'Wall', path: '/community/wall' },
  { key: 'calendar', label: 'Calendar', path: '/calendar', feature: 'enableCalendar' },
  { key: 'prayerWall', label: 'Prayer Wall', path: '/prayer-wall', feature: 'enablePrayerWall' },
  { key: 'members', label: 'Members', path: '/members', feature: 'enableMemberDirectory' },
  { key: 'staff', label: 'Staff', path: '/staff', feature: 'enableMemberDirectory' },
  { key: 'chat', label: 'Chat', path: '/chat', feature: 'enableGroupChat' },
  { key: 'smallGroups', label: 'Small Groups', path: '/small-groups', feature: 'enableSmallGroups' },
  { key: 'volunteering', label: 'Volunteering', path: '/volunteering', feature: 'enableVolunteering' },
  { key: 'resourceCenter', label: 'Resources', path: '/resources', feature: 'enableResourceCenter' },
];

const serviceSubItems: { key: string; label: string; path: string }[] = [
  { key: 'ceremony', label: 'Ceremony', path: '/services?category=CEREMONY' },
  { key: 'education', label: 'Education', path: '/services?category=EDUCATION' },
  { key: 'counseling', label: 'Counseling', path: '/services?category=COUNSELING' },
  { key: 'facility', label: 'Facilities', path: '/services?category=FACILITY' },
  { key: 'other', label: 'Other', path: '/services?category=OTHER' },
];

export default function TenantNav({ tenant, canViewSettings }: TenantNavProps) {
  const pathname = usePathname();
  const basePath = `/tenants/${tenant.id}`;
  const deriveLockedSubmenu = React.useCallback((): SubmenuKey | null => {
    if (
      pathname.startsWith(`${basePath}/content`) ||
      contentSubItems.some((sub) => pathname.startsWith(`${basePath}${sub.path}`))
    ) {
      return 'content';
    }

    if (
      pathname.startsWith(`${basePath}/community`) ||
      communitySubItems.some((sub) => pathname.startsWith(`${basePath}${sub.path}`))
    ) {
      return 'community';
    }

    if (pathname.startsWith(`${basePath}/services`)) {
      return 'services';
    }

    if (pathname.startsWith(`${basePath}/settings`)) {
      return 'settings';
    }

    return null;
  }, [basePath, pathname]);

  const lockedSubmenu = React.useMemo(() => deriveLockedSubmenu(), [deriveLockedSubmenu]);
  const [activeSubmenu, setActiveSubmenu] = React.useState<SubmenuKey | null>(lockedSubmenu);
  const contentShowTimer = React.useRef<NodeJS.Timeout | null>(null);
  const contentHideTimer = React.useRef<NodeJS.Timeout | null>(null);
  const communityShowTimer = React.useRef<NodeJS.Timeout | null>(null);
  const communityHideTimer = React.useRef<NodeJS.Timeout | null>(null);
  const servicesShowTimer = React.useRef<NodeJS.Timeout | null>(null);
  const servicesHideTimer = React.useRef<NodeJS.Timeout | null>(null);
  const settingsShowTimer = React.useRef<NodeJS.Timeout | null>(null);
  const settingsHideTimer = React.useRef<NodeJS.Timeout | null>(null);
  const submenuTimers: Record<SubmenuKey, { show: React.MutableRefObject<NodeJS.Timeout | null>; hide: React.MutableRefObject<NodeJS.Timeout | null> }> = {
    content: { show: contentShowTimer, hide: contentHideTimer },
    community: { show: communityShowTimer, hide: communityHideTimer },
    services: { show: servicesShowTimer, hide: servicesHideTimer },
    settings: { show: settingsShowTimer, hide: settingsHideTimer },
  };

  const clearTimer = (timerRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const setVisibleSubmenu = (key: SubmenuKey | null) => {
    setActiveSubmenu(key);
  };

  const scheduleShow = (key: SubmenuKey) => {
    if (lockedSubmenu && lockedSubmenu !== key) return;

    const showTimer = submenuTimers[key].show;
    const hideTimer = submenuTimers[key].hide;
    clearTimer(hideTimer);
    clearTimer(showTimer);
    setVisibleSubmenu(key);
  };

  const scheduleHide = (key: SubmenuKey) => {
    if (lockedSubmenu) return;

    const showTimer = submenuTimers[key].show;
    const hideTimer = submenuTimers[key].hide;
    clearTimer(showTimer);
    clearTimer(hideTimer);
    hideTimer.current = setTimeout(() => {
      setActiveSubmenu((prev) => (prev === key ? null : prev));
    }, 750);
  };

  React.useEffect(() => {
    return () => {
      Object.values(submenuTimers).forEach(({ show, hide }) => {
        clearTimer(show);
        clearTimer(hide);
      });
    };
  }, []);

  React.useEffect(() => {
    setActiveSubmenu(lockedSubmenu);
  }, [lockedSubmenu]);

  const isFeatureEnabled = (feature?: NavItemFeature) =>
    !feature || (tenant.settings ? Boolean(tenant.settings[feature as keyof TenantSettings]) : false);

  const baseClasses = (active: boolean) =>
    `${
      active
        ? 'border-amber-500 text-amber-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    } inline-flex h-11 items-center whitespace-nowrap px-3 border-b-2 font-medium text-sm`;

  const submenuChipClasses =
    'inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-amber-300 hover:text-amber-700';

  const renderSubmenu = (
    key: SubmenuKey,
    items: { key: string; label: string; path: string; feature?: NavItemFeature }[]
  ) => {
    if (activeSubmenu !== key) return null;

    return (
      <div
        className="flex flex-wrap gap-2"
        onMouseEnter={() => clearTimer(submenuTimers[key].hide)}
        onMouseLeave={() => scheduleHide(key)}
      >
        {items
          .filter((sub) => isFeatureEnabled(sub.feature))
          .map((sub) => (
            <Link key={sub.key} href={`${basePath}${sub.path}`} className={submenuChipClasses}>
              {sub.label}
            </Link>
          ))}
      </div>
    );
  };

  return (
    <nav className="border-t border-gray-200" style={{ ['--tenant-nav-height' as any]: '6rem' }}>
      <div className="-mb-px flex flex-wrap items-stretch gap-4 border-b border-gray-200 pb-1">
        {navItems.map((item) => {
          const isEnabled = isFeatureEnabled(item.feature);
          if (!isEnabled) return null;
          if (item.adminOnly && !canViewSettings) return null;

          const fullPath = `${basePath}${item.path}`;
          const pathOnly = item.path.split('?')[0];
          const fullPathOnly = `${basePath}${pathOnly}`;
          const isActive =
            pathname === fullPathOnly ||
            (item.path === '' && pathname === basePath) ||
            (item.key === 'content' && contentSubItems.some((sub) => pathname.startsWith(`${basePath}${sub.path}`))) ||
            (item.key === 'community' && communitySubItems.some((sub) => pathname.startsWith(`${basePath}${sub.path}`))) ||
            (item.key === 'services' && pathname.startsWith(`${basePath}/services`)) ||
            (item.key === 'settings' && pathname.startsWith(`${basePath}/settings`));

          if (item.key === 'content') {
            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => scheduleShow('content')}
                onMouseLeave={() => scheduleHide('content')}
              >
                <Link href={fullPath} className={baseClasses(isActive)}>
                  {item.label}
                </Link>
              </div>
            );
          }

          if (item.key === 'community') {
            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => scheduleShow('community')}
                onMouseLeave={() => scheduleHide('community')}
              >
                <Link href={fullPath} className={baseClasses(isActive)}>
                  {item.label}
                </Link>
              </div>
            );
          }

          if (item.key === 'services') {
            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => scheduleShow('services')}
                onMouseLeave={() => scheduleHide('services')}
              >
                <Link href={fullPath} className={baseClasses(isActive)}>
                  {item.label}
                </Link>
              </div>
            );
          }

          if (item.key === 'settings') {
            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => scheduleShow('settings')}
                onMouseLeave={() => scheduleHide('settings')}
              >
                <Link href={fullPath} className={baseClasses(isActive)}>
                  {item.label}
                </Link>
              </div>
            );
          }

          return (
            <Link key={item.key} href={fullPath} className={baseClasses(isActive)}>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="space-y-2 border-t border-gray-200 pt-1 pb-0">
        {renderSubmenu('content', contentSubItems)}
        {renderSubmenu('community', communitySubItems)}
        {renderSubmenu('services', serviceSubItems)}
        {activeSubmenu === 'settings' && (
          <div
            className="flex flex-wrap gap-2"
            onMouseEnter={() => clearTimer(submenuTimers.settings.hide)}
            onMouseLeave={() => scheduleHide('settings')}
          >
            {CONTROL_PANEL_TABS.map((tab) => {
              const slug = tab.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return (
                <Link
                  key={tab}
                  href={`${basePath}/settings${slug ? `?category=${slug}` : ''}`}
                  className={submenuChipClasses}
                >
                  {tab}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
