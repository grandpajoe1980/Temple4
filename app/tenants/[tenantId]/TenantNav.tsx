'use client';

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
    { key: 'posts', label: 'Posts', path: '/posts', feature: 'enablePosts' },
    { key: 'calendar', label: 'Calendar', path: '/calendar', feature: 'enableCalendar' },
    { key: 'services', label: 'Services', path: '/services', feature: 'enableServices' },
    { key: 'volunteering', label: 'Volunteering', path: '/volunteering', feature: 'enableVolunteering' },
    { key: 'smallGroups', label: 'Small Groups', path: '/small-groups', feature: 'enableSmallGroups' },
    // Facilities are handled inside the Services page as a category and have
    // been removed from the top-level tenant nav to keep the navigation
    // surface focused. The tenant nav will no longer render a Facilities link.
    { key: 'liveStream', label: 'Live Stream', path: '/livestream', feature: 'enableLiveStream' },
    { key: 'prayerWall', label: 'Prayer Wall', path: '/prayer-wall', feature: 'enablePrayerWall' },
    { key: 'resourceCenter', label: 'Resources', path: '/resources', feature: 'enableResourceCenter' },
    { key: 'sermons', label: 'Sermons', path: '/sermons', feature: 'enableSermons' },
    { key: 'podcasts', label: 'Podcasts', path: '/podcasts', feature: 'enablePodcasts' },
    { key: 'books', label: 'Books', path: '/books', feature: 'enableBooks' },
    { key: 'members', label: 'Members', path: '/members', feature: 'enableMemberDirectory' },
    { key: 'chat', label: 'Chat', path: '/chat', feature: 'enableGroupChat' },
    { key: 'donations', label: 'Donations', path: '/donations', feature: 'enableDonations' },
    { key: 'contact', label: 'Contact', path: '/contact' },
    { key: 'settings', label: 'Settings', path: '/settings', adminOnly: true },
];

export default function TenantNav({ tenant, canViewSettings }: TenantNavProps) {
  const pathname = usePathname();
  const basePath = `/tenants/${tenant.id}`;

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
