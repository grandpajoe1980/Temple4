"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Tenant, TenantSettings } from '@prisma/client';

interface TenantNavProps {
  tenant: Tenant & { settings: TenantSettings | null };
  canViewSettings: boolean;
}

type TenantPage =
  | 'home'
  | 'content'
  | 'community'
  | 'staff'
  | 'settings'
  | 'posts'
  | 'calendar'
  | 'sermons'
  | 'podcasts'
  | 'books'
  | 'members'
  | 'chat'
  | 'donations'
  | 'contact'
  | 'volunteering'
  | 'smallGroups'
  | 'liveStream'
  | 'prayerWall'
  | 'resourceCenter'
  | 'services'
  | 'facilities';
type NavItemFeature = keyof Omit<TenantSettings, 'id' | 'tenantId' | 'isPublic' | 'membershipApprovalMode' | 'visitorVisibility' | 'donationSettings' | 'liveStreamSettings'>;


const navItems: { key: TenantPage; label: string; path: string; feature?: NavItemFeature, adminOnly?: boolean }[] = [
  { key: 'home', label: 'Home', path: '' },
  { key: 'content', label: 'Content', path: '/content' },
  // Community is a parent entry that groups several community-related pages.
  { key: 'community', label: 'Community', path: '/community' },
  { key: 'services', label: 'Services', path: '/services', feature: 'enableServices' },
  { key: 'liveStream', label: 'Live Stream', path: '/livestream', feature: 'enableLiveStream' },
  { key: 'donations', label: 'Donations', path: '/donations', feature: 'enableDonations' },
  { key: 'contact', label: 'Contact Us', path: '/contact' },
  { key: 'settings', label: 'Settings', path: '/settings', adminOnly: true },
];

// Items that should be shown underneath the Community parent
// Use `string` for the key here to avoid tight coupling of the nav literal keys
const communitySubItems: { key: string; label: string; path: string; feature?: NavItemFeature }[] = [
  { key: 'posts', label: 'Posts', path: '/posts', feature: 'enablePosts' },
  { key: 'wall', label: 'Wall', path: '/community/wall' },
  { key: 'calendar', label: 'Calendar', path: '/calendar', feature: 'enableCalendar' },
  { key: 'staff', label: 'Staff', path: '/staff', feature: 'enableMemberDirectory' },
  { key: 'prayerWall', label: 'Prayer Wall', path: '/prayer-wall', feature: 'enablePrayerWall' },
  { key: 'members', label: 'Members', path: '/members', feature: 'enableMemberDirectory' },
  { key: 'chat', label: 'Chat', path: '/chat', feature: 'enableGroupChat' },
  { key: 'smallGroups', label: 'Small Groups', path: '/small-groups', feature: 'enableSmallGroups' },
  { key: 'volunteering', label: 'Volunteering', path: '/volunteering', feature: 'enableVolunteering' },
  { key: 'resourceCenter', label: 'Resources', path: '/resources', feature: 'enableResourceCenter' },
];

export default function TenantNav({ tenant, canViewSettings }: TenantNavProps) {
  const pathname = usePathname();
  const basePath = `/tenants/${tenant.id}`;
  const [showCommunity, setShowCommunity] = React.useState(false);

  return (
    <nav className="-mb-px flex space-x-6 overflow-x-auto border-t border-gray-200">
      {navItems.map((item) => {
        const isEnabled =
          !item.feature || (tenant.settings ? Boolean(tenant.settings[item.feature as keyof TenantSettings]) : false);
        if (!isEnabled) return null;
        if (item.adminOnly && !canViewSettings) return null;

        const fullPath = `${basePath}${item.path}`;
        // Determine the path-only portion (strip any query string) so that
        // active detection works for links like `/services?category=...`.
        const pathOnly = item.path.split('?')[0];
        const fullPathOnly = `${basePath}${pathOnly}`;
        const isActive = pathname === fullPathOnly || (item.path === '' && pathname === basePath);

        // Render the Community parent with a hover/focus submenu
        if (item.key === 'community') {
          const communityActive = communitySubItems.some((s) => `${basePath}${s.path}` === pathname);
          return (
            <div
              key={item.key}
              className="relative"
              onMouseEnter={() => setShowCommunity(true)}
              onMouseLeave={() => setShowCommunity(false)}
            >
              <Link
                href={fullPath}
                className={`${
                  communityActive
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
              >
                {item.label}
              </Link>

              {showCommunity && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    {communitySubItems.map((sub) => {
                      const enabled = !sub.feature || (tenant.settings ? Boolean(tenant.settings[sub.feature as keyof TenantSettings]) : false);
                      if (!enabled) return null;
                      const subPath = `${basePath}${sub.path}`;
                      return (
                        <Link
                          key={sub.key}
                          href={subPath}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.key}
            href={fullPath}
            className={`${
              isActive
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
