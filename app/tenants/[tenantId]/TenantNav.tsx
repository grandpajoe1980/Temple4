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
  const [showContent, setShowContent] = React.useState(false);
  const [showCommunity, setShowCommunity] = React.useState(false);
  const [showServices, setShowServices] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const contentShowTimer = React.useRef<NodeJS.Timeout | null>(null);
  const contentHideTimer = React.useRef<NodeJS.Timeout | null>(null);
  const communityShowTimer = React.useRef<NodeJS.Timeout | null>(null);
  const communityHideTimer = React.useRef<NodeJS.Timeout | null>(null);
  const servicesShowTimer = React.useRef<NodeJS.Timeout | null>(null);
  const servicesHideTimer = React.useRef<NodeJS.Timeout | null>(null);
  const settingsShowTimer = React.useRef<NodeJS.Timeout | null>(null);
  const settingsHideTimer = React.useRef<NodeJS.Timeout | null>(null);

  const clearTimer = (timerRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleShow = (
    showTimer: React.MutableRefObject<NodeJS.Timeout | null>,
    hideTimer: React.MutableRefObject<NodeJS.Timeout | null>,
    setter: (value: boolean) => void
  ) => {
    clearTimer(hideTimer);
    clearTimer(showTimer);
    showTimer.current = setTimeout(() => setter(true), 300);
  };

  const scheduleHide = (
    showTimer: React.MutableRefObject<NodeJS.Timeout | null>,
    hideTimer: React.MutableRefObject<NodeJS.Timeout | null>,
    setter: (value: boolean) => void
  ) => {
    clearTimer(showTimer);
    clearTimer(hideTimer);
    hideTimer.current = setTimeout(() => setter(false), 750);
  };

  React.useEffect(() => {
    return () => {
      [
        contentShowTimer,
        contentHideTimer,
        communityShowTimer,
        communityHideTimer,
        servicesShowTimer,
        servicesHideTimer,
        settingsShowTimer,
        settingsHideTimer,
      ].forEach(clearTimer);
    };
  }, []);

  const isFeatureEnabled = (feature?: NavItemFeature) =>
    !feature || (tenant.settings ? Boolean(tenant.settings[feature as keyof TenantSettings]) : false);

  const baseClasses = (active: boolean) =>
    `${
      active
        ? 'border-amber-500 text-amber-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`;

  return (
    <nav className="-mb-px flex space-x-6 overflow-x-auto border-t border-gray-200">
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

        const renderDropdown = (
          shouldShow: boolean,
          onEnter: () => void,
          onLeave: () => void,
          content: React.ReactNode,
          widthClass = 'w-44'
        ) =>
          shouldShow && (
            <div
              className={`absolute left-0 top-full mt-1 ${widthClass} bg-white border border-gray-200 rounded-md shadow-lg z-50`}
              onMouseEnter={onEnter}
              onMouseLeave={onLeave}
            >
              <div className="py-1">{content}</div>
            </div>
          );

        if (item.key === 'content') {
          return (
            <div
              key={item.key}
              className="relative"
              onMouseEnter={() => scheduleShow(contentShowTimer, contentHideTimer, setShowContent)}
              onMouseLeave={() => scheduleHide(contentShowTimer, contentHideTimer, setShowContent)}
            >
              <Link href={fullPath} className={baseClasses(isActive)}>
                {item.label}
              </Link>
              {renderDropdown(
                showContent,
                () => clearTimer(contentHideTimer),
                () => scheduleHide(contentShowTimer, contentHideTimer, setShowContent),
                contentSubItems
                  .filter((sub) => isFeatureEnabled(sub.feature))
                  .map((sub) => (
                    <Link
                      key={sub.key}
                      href={`${basePath}${sub.path}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {sub.label}
                    </Link>
                  ))
              )}
            </div>
          );
        }

        if (item.key === 'community') {
          return (
            <div
              key={item.key}
              className="relative"
              onMouseEnter={() => scheduleShow(communityShowTimer, communityHideTimer, setShowCommunity)}
              onMouseLeave={() => scheduleHide(communityShowTimer, communityHideTimer, setShowCommunity)}
            >
              <Link href={fullPath} className={baseClasses(isActive)}>
                {item.label}
              </Link>
              {renderDropdown(
                showCommunity,
                () => clearTimer(communityHideTimer),
                () => scheduleHide(communityShowTimer, communityHideTimer, setShowCommunity),
                communitySubItems
                  .filter((sub) => isFeatureEnabled(sub.feature))
                  .map((sub) => (
                    <Link
                      key={sub.key}
                      href={`${basePath}${sub.path}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {sub.label}
                    </Link>
                  ))
              )}
            </div>
          );
        }

        if (item.key === 'services') {
          return (
            <div
              key={item.key}
              className="relative"
              onMouseEnter={() => scheduleShow(servicesShowTimer, servicesHideTimer, setShowServices)}
              onMouseLeave={() => scheduleHide(servicesShowTimer, servicesHideTimer, setShowServices)}
            >
              <Link href={fullPath} className={baseClasses(isActive)}>
                {item.label}
              </Link>
              {renderDropdown(
                showServices,
                () => clearTimer(servicesHideTimer),
                () => scheduleHide(servicesShowTimer, servicesHideTimer, setShowServices),
                serviceSubItems.map((sub) => (
                  <Link
                    key={sub.key}
                    href={`${basePath}${sub.path}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {sub.label}
                  </Link>
                ))
              )}
            </div>
          );
        }

        if (item.key === 'settings') {
          return (
            <div
              key={item.key}
              className="relative"
              onMouseEnter={() => scheduleShow(settingsShowTimer, settingsHideTimer, setShowSettings)}
              onMouseLeave={() => scheduleHide(settingsShowTimer, settingsHideTimer, setShowSettings)}
            >
              <Link href={fullPath} className={baseClasses(isActive)}>
                {item.label}
              </Link>
              {renderDropdown(
                showSettings,
                () => clearTimer(settingsHideTimer),
                () => scheduleHide(settingsShowTimer, settingsHideTimer, setShowSettings),
                CONTROL_PANEL_TABS.map((tab) => {
                  const slug = tab.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  return (
                    <Link
                      key={tab}
                      href={`${basePath}/settings${slug ? `?category=${slug}` : ''}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {tab}
                    </Link>
                  );
                }),
                'w-64'
              )}
            </div>
          );
        }

        return (
          <Link key={item.key} href={fullPath} className={baseClasses(isActive)}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
