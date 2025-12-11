"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { Tenant, TenantSettings } from '@prisma/client';

interface TenantNavProps {
  tenant: Tenant & { settings: TenantSettings | null };
  canViewSettings: boolean;
}

type TenantPage = 'home' | 'content' | 'community' | 'work' | 'settings' | 'services' | 'donations' | 'contact';
// Settings removed from submenu - uses ControlPanel sidebar instead
type SubmenuKey = 'content' | 'community' | 'work' | 'services' | 'donations';
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
  { key: 'community', label: 'Community', path: '/posts' },
  { key: 'work', label: 'Work', path: '/admin/workboard' },
  { key: 'services', label: 'Services', path: '/services', feature: 'enableServices' },
  { key: 'donations', label: 'Donations', path: '/donations', feature: 'enableDonations' },
  { key: 'contact', label: 'Contact Us', path: '/contact' },
  { key: 'settings', label: 'Settings', path: '/settings', adminOnly: true },
];

const contentSubItems: { key: string; label: string; path: string; feature?: NavItemFeature }[] = [
  { key: 'photos', label: 'Photos', path: '/photos', feature: 'enablePhotos' },
  { key: 'podcasts', label: 'Podcasts', path: '/podcasts', feature: 'enablePodcasts' },
  { key: 'talks', label: 'Talks', path: '/talks', feature: 'enableTalks' },
  { key: 'books', label: 'Books', path: '/books', feature: 'enableBooks' },
  { key: 'liveStream', label: 'Live Stream', path: '/livestream', feature: 'enableLiveStream' },
];

const communitySubItems: { key: string; label: string; path: string; feature?: NavItemFeature; adminOnly?: boolean }[] = [
  { key: 'posts', label: 'Posts', path: '/posts', feature: 'enablePosts' },
  { key: 'events', label: 'Events', path: '/events', feature: 'enableEvents' },
  { key: 'wall', label: 'Wall', path: '/community/wall' },
  { key: 'calendar', label: 'Calendar', path: '/calendar', feature: 'enableCalendar' },
  { key: 'members', label: 'Members', path: '/members', feature: 'enableMemberDirectory' },
  { key: 'supportRequests', label: 'Support', path: '/support-requests', feature: 'enableSupportRequests' },
  { key: 'memorials', label: 'Memorials', path: '/memorials', feature: 'enableMemorials' },
  { key: 'staff', label: 'Staff', path: '/staff', feature: 'enableMemberDirectory' },
  { key: 'chat', label: 'Chat', path: '/chat', feature: 'enableGroupChat' },
  { key: 'smallGroups', label: 'Small Groups', path: '/small-groups', feature: 'enableSmallGroups' },
  { key: 'trips', label: 'Trips', path: '/trips', feature: 'enableTrips' },
  { key: 'volunteering', label: 'Volunteering', path: '/volunteering', feature: 'enableVolunteering' },
  { key: 'resourceCenter', label: 'Resources', path: '/resources', feature: 'enableResourceCenter' },
];

const workSubItems: { key: string; label: string; path: string; feature?: NavItemFeature; adminOnly?: boolean }[] = [
  { key: 'workboard', label: 'Workboard', path: '/admin/workboard', feature: 'enableWorkboard' },
  { key: 'tickets', label: 'Tickets', path: '/admin/tickets', feature: 'enableTicketing' },
  { key: 'assets', label: 'Assets', path: '/admin/assets', feature: 'enableAssetManagement' },
];

const serviceSubItems: { key: string; label: string; path: string }[] = [
  { key: 'ceremony', label: 'Ceremony', path: '/services?category=CEREMONY' },
  { key: 'education', label: 'Education', path: '/services?category=EDUCATION' },
  { key: 'counseling', label: 'Counseling', path: '/services?category=COUNSELING' },
  { key: 'facility', label: 'Facilities', path: '/services?category=FACILITY' },
  { key: 'other', label: 'Other', path: '/services?category=OTHER' },
];

const donationsSubItems: { key: string; label: string; path: string; feature?: NavItemFeature }[] = [
  { key: 'give', label: 'Give Now', path: '/donations' },
  { key: 'funds', label: 'Funds', path: '/donations/funds' },
  { key: 'pledges', label: 'My Pledges', path: '/donations/pledges', feature: 'enableRecurringPledges' },
];

// Settings submenu removed - ControlPanel has a comprehensive sidebar for settings navigation

export default function TenantNav({ tenant, canViewSettings }: TenantNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basePath = `/tenants/${tenant.id}`;
  const [userPermissions, setUserPermissions] = React.useState<Record<string, boolean> | null>(null);
  const [membership, setMembership] = React.useState<any | null>(null);
  const [tenantPermissions, setTenantPermissions] = React.useState<Record<string, any> | null>(null);
  const navRef = React.useRef<HTMLElement | null>(null);
  const navTabsRef = React.useRef<HTMLDivElement | null>(null);
  const workFeaturesOn = Boolean(
    tenant.settings?.enableWorkboard || tenant.settings?.enableTicketing || tenant.settings?.enableAssetManagement
  );
  const [activeSubmenu, setActiveSubmenu] = React.useState<SubmenuKey | null>(null);
  const contentShowTimer = React.useRef<NodeJS.Timeout | null>(null);
  const contentHideTimer = React.useRef<NodeJS.Timeout | null>(null);
  const communityShowTimer = React.useRef<NodeJS.Timeout | null>(null);
  const communityHideTimer = React.useRef<NodeJS.Timeout | null>(null);
  const workShowTimer = React.useRef<NodeJS.Timeout | null>(null);
  const workHideTimer = React.useRef<NodeJS.Timeout | null>(null);
  const servicesShowTimer = React.useRef<NodeJS.Timeout | null>(null);
  const servicesHideTimer = React.useRef<NodeJS.Timeout | null>(null);
  const donationsShowTimer = React.useRef<NodeJS.Timeout | null>(null);
  const donationsHideTimer = React.useRef<NodeJS.Timeout | null>(null);
  const submenuTimers: Record<SubmenuKey, { show: React.MutableRefObject<NodeJS.Timeout | null>; hide: React.MutableRefObject<NodeJS.Timeout | null> }> = React.useMemo(
    () => ({
      content: { show: contentShowTimer, hide: contentHideTimer },
      community: { show: communityShowTimer, hide: communityHideTimer },
      work: { show: workShowTimer, hide: workHideTimer },
      services: { show: servicesShowTimer, hide: servicesHideTimer },
      donations: { show: donationsShowTimer, hide: donationsHideTimer },
    }),
    []
  );

  const updateNavHeightVar = React.useCallback(() => {
    if (!navRef.current) return;
    const height = navRef.current.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--tenant-nav-height', `${height}px`);
  }, []);

  const updateNavTabsHeightVar = React.useCallback(() => {
    if (!navTabsRef.current) return;
    const height = navTabsRef.current.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--tenant-nav-tabs-height', `${height}px`);
  }, []);

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
    const showTimer = submenuTimers[key].show;
    const hideTimer = submenuTimers[key].hide;
    clearTimer(hideTimer);
    clearTimer(showTimer);
    // If we're hovering the submenu for the current page, leave the visible state as-is.
    if (lockedSubmenu === key) {
      setVisibleSubmenu(lockedSubmenu);
      return;
    }
    setVisibleSubmenu(key);
  };


  // Fetch per-user permissions and tenant permission defaults for this tenant
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/me`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setUserPermissions(data?.permissions || null);
            setMembership(data?.membership || null);
            setTenantPermissions(data?.tenant?.permissions || null);
          }
        }
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [tenant.id]);

  // Helper: determine whether membership roles grant canViewWorkMenu via tenant.permissions
  const membershipAllowsWork = React.useCallback(() => {
    if (!membership || !tenantPermissions) return false;
    const roles: { role: string }[] = membership.roles || [];
    for (const r of roles) {
      const key = r.role as string;
      if (tenantPermissions[key] && tenantPermissions[key].canViewWorkMenu) return true;
    }
    return false;
  }, [membership, tenantPermissions]);
  const hasWorkAccess = Boolean(
    canViewSettings || userPermissions?.canViewWorkMenu || membershipAllowsWork()
  );
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

    if (workSubItems.some((sub) => pathname.startsWith(`${basePath}${sub.path}`)) && workFeaturesOn && hasWorkAccess) {
      return 'work';
    }

    if (pathname.startsWith(`${basePath}/services`)) {
      return 'services';
    }

    if (pathname.startsWith(`${basePath}/donations`)) {
      return 'donations';
    }

    return null;
  }, [basePath, pathname, hasWorkAccess, workFeaturesOn]);

  const lockedSubmenu = React.useMemo(() => deriveLockedSubmenu(), [deriveLockedSubmenu]);
  const scheduleHide = (key: SubmenuKey) => {
    if (lockedSubmenu === key) return;
    const showTimer = submenuTimers[key].show;
    const hideTimer = submenuTimers[key].hide;
    clearTimer(showTimer);
    clearTimer(hideTimer);
    hideTimer.current = setTimeout(() => {
      setActiveSubmenu((prev) => {
        if (prev !== key) return prev;
        return lockedSubmenu ?? null;
      });
    }, 400);
  };

  React.useEffect(() => {
    return () => {
      Object.values(submenuTimers).forEach(({ show, hide }) => {
        clearTimer(show);
        clearTimer(hide);
      });
    };
  }, [submenuTimers]);

  React.useEffect(() => {
    setActiveSubmenu(lockedSubmenu);
  }, [lockedSubmenu]);

  React.useEffect(() => {
    const handleResize = () => updateNavHeightVar();
    updateNavHeightVar();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateNavHeightVar]);

  React.useEffect(() => {
    updateNavHeightVar();
  }, [activeSubmenu, updateNavHeightVar]);

  React.useEffect(() => {
    const handleResize = () => updateNavTabsHeightVar();
    updateNavTabsHeightVar();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateNavTabsHeightVar]);

  const isFeatureEnabled = (feature?: NavItemFeature) =>
    !feature || (tenant.settings ? Boolean(tenant.settings[feature as keyof TenantSettings]) : false);

  const baseClasses = (active: boolean) =>
    `${active
      ? 'tenant-active'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    } inline-flex h-11 items-center whitespace-nowrap px-3 border-b-2 font-medium text-sm`;

  const submenuChipClasses = 'menu-chip';

  const renderSubmenu = (
    key: SubmenuKey,
    items: { key: string; label: string; path: string; feature?: NavItemFeature; adminOnly?: boolean }[]
  ) => {
    // Determine active category from the URL (if present)
    const activeCategory = searchParams?.get('category') || '';

    return items
      .filter((sub) => isFeatureEnabled(sub.feature))
      .filter((sub) => !sub.adminOnly || canViewSettings || (key === 'work' && hasWorkAccess))
      .map((sub) => {
        const match = sub.path.match(/\?category=([^&]+)/);
        const subCategory = match ? match[1] : '';
        let isActive = false;
        if (subCategory) {
          isActive = subCategory === activeCategory;
        } else {
          isActive = pathname.startsWith(`${basePath}${sub.path}`);
        }
        const activeClasses = 'menu-chip menu-chip--active';
        return (
          <Link key={sub.key} href={`${basePath}${sub.path}`} className={isActive ? activeClasses : submenuChipClasses}>
            {sub.label}
          </Link>
        );
      });
  };

  const renderActiveSubmenuOverlay = () => {
    if (!activeSubmenu || activeSubmenu === lockedSubmenu) return null;
    if (typeof document === 'undefined') return null; // SSR guard
    const itemsByKey: Record<SubmenuKey, { key: string; label: string; path: string; feature?: NavItemFeature; adminOnly?: boolean }[]> = {
      content: contentSubItems,
      community: communitySubItems,
      work: workSubItems,
      services: serviceSubItems,
      donations: donationsSubItems,
    };
    const items = itemsByKey[activeSubmenu];
    if (!items?.length) return null;

    return createPortal(
      <div
        className="pointer-events-auto fixed inset-x-0 z-[2147483647] px-4 pt-2 sm:px-6 lg:px-8"
        style={{ top: 0 }}
        onMouseEnter={() => clearTimer(submenuTimers[activeSubmenu].hide)}
        onMouseLeave={() => scheduleHide(activeSubmenu)}
      >
        <div className="mx-auto max-w-5xl rounded-full border tenant-border-200 bg-card px-4 py-3 shadow-lg backdrop-blur-sm overflow-x-auto">
          <div className="flex flex-nowrap items-center justify-start gap-2 whitespace-nowrap">
            {renderSubmenu(activeSubmenu, items)}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const renderInlineLockedSubmenu = () => {
    if (!lockedSubmenu) return null;
    const itemsByKey: Record<SubmenuKey, { key: string; label: string; path: string; feature?: NavItemFeature; adminOnly?: boolean }[]> = {
      content: contentSubItems,
      community: communitySubItems,
      work: workSubItems,
      services: serviceSubItems,
      donations: donationsSubItems,
    };
    const items = itemsByKey[lockedSubmenu];
    if (!items?.length) return null;

    return (
      <div className="space-y-2 border-t border-gray-200 pt-1 pb-0">
        <div
          className="flex flex-wrap gap-2"
          onMouseEnter={() => clearTimer(submenuTimers[lockedSubmenu].hide)}
          onMouseLeave={() => scheduleHide(lockedSubmenu)}
        >
          {renderSubmenu(lockedSubmenu, items)}
        </div>
      </div>
    );
  };

  return (
    <nav ref={navRef} className="relative z-[10] border-t border-gray-200 hidden md:block" style={{ ['--tenant-nav-height' as any]: '6rem' }}>
      {renderActiveSubmenuOverlay()}
      <div ref={navTabsRef} className="-mb-px flex flex-wrap items-stretch gap-4 border-b border-gray-200 pb-1">
        {navItems.map((item) => {
          const isEnabled = isFeatureEnabled(item.feature);
          if (!isEnabled) return null;
          if (item.key === 'work' && (!workFeaturesOn || !hasWorkAccess)) return null;
          // Allow admin-only items when the user can view settings (admins) OR when
          // this is the Work item and the user's tenant permissions explicitly allow it.
          if (
            item.adminOnly &&
            !(
              canViewSettings ||
              (item.key === 'work' && hasWorkAccess)
            )
          )
            return null;

          const fullPath = `${basePath}${item.path}`;
          const pathOnly = item.path.split('?')[0];
          const fullPathOnly = `${basePath}${pathOnly}`;
          const isActive =
            pathname === fullPathOnly ||
            (item.path === '' && pathname === basePath) ||
            (item.key === 'content' && contentSubItems.some((sub) => pathname.startsWith(`${basePath}${sub.path}`))) ||
            (item.key === 'community' && communitySubItems.some((sub) => pathname.startsWith(`${basePath}${sub.path}`))) ||
            (item.key === 'work' && workSubItems.some((sub) => pathname.startsWith(`${basePath}${sub.path}`))) ||
            (item.key === 'services' && pathname.startsWith(`${basePath}/services`)) ||
            (item.key === 'donations' && pathname.startsWith(`${basePath}/donations`)) ||
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

          if (item.key === 'work') {
            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => scheduleShow('work')}
                onMouseLeave={() => scheduleHide('work')}
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

          if (item.key === 'donations') {
            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => scheduleShow('donations')}
                onMouseLeave={() => scheduleHide('donations')}
              >
                <Link href={fullPath} className={baseClasses(isActive)}>
                  {item.label}
                </Link>
              </div>
            );
          }

          // Settings is a simple link - no hover submenu, uses ControlPanel sidebar instead
          return (
            <Link key={item.key} href={fullPath} className={baseClasses(isActive)}>
              {item.label}
            </Link>
          );
        })}
      </div>
      {renderInlineLockedSubmenu()}
    </nav>
  );
}
