"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CONTROL_PANEL_TABS } from '@/constants';
import { ThemeToggle } from '../ThemeToggle';

interface MobileNavProps {
  className?: string;
}

interface TenantSettings {
  enableServices?: boolean;
  enableDonations?: boolean;
  enablePhotos?: boolean;
  enablePodcasts?: boolean;
  enableTalks?: boolean;
  enableBooks?: boolean;
  enableLiveStream?: boolean;
  enableEvents?: boolean;
  enablePosts?: boolean;
  enableCalendar?: boolean;
  enableSupportRequests?: boolean;
  enableMemorials?: boolean;
  enableMemberDirectory?: boolean;
  enableGroupChat?: boolean;
  enableSmallGroups?: boolean;
  enableTrips?: boolean;
  enableVolunteering?: boolean;
  enableResourceCenter?: boolean;
  enableWorkboard?: boolean;
  enableTicketing?: boolean;
  enableAssetManagement?: boolean;
  enableRecurringPledges?: boolean;
}

const contentSubItems = [
  { key: 'photos', label: 'Photos', path: '/photos', feature: 'enablePhotos' },
  { key: 'podcasts', label: 'Podcasts', path: '/podcasts', feature: 'enablePodcasts' },
  { key: 'talks', label: 'Talks', path: '/talks', feature: 'enableTalks' },
  { key: 'books', label: 'Books', path: '/books', feature: 'enableBooks' },
  { key: 'liveStream', label: 'Live Stream', path: '/livestream', feature: 'enableLiveStream' },
];

const communitySubItems = [
  { key: 'events', label: 'Events', path: '/events', feature: 'enableEvents' },
  { key: 'posts', label: 'Posts', path: '/posts', feature: 'enablePosts' },
  { key: 'wall', label: 'Wall', path: '/community/wall' },
  { key: 'calendar', label: 'Calendar', path: '/calendar', feature: 'enableCalendar' },
  { key: 'supportRequests', label: 'Support', path: '/support-requests', feature: 'enableSupportRequests' },
  { key: 'memorials', label: 'Memorials', path: '/memorials', feature: 'enableMemorials' },
  { key: 'members', label: 'Members', path: '/members', feature: 'enableMemberDirectory' },
  { key: 'staff', label: 'Staff', path: '/staff', feature: 'enableMemberDirectory' },
  { key: 'chat', label: 'Chat', path: '/chat', feature: 'enableGroupChat' },
  { key: 'smallGroups', label: 'Small Groups', path: '/small-groups', feature: 'enableSmallGroups' },
  { key: 'trips', label: 'Trips', path: '/trips', feature: 'enableTrips' },
  { key: 'volunteering', label: 'Volunteering', path: '/volunteering', feature: 'enableVolunteering' },
  { key: 'resources', label: 'Resources', path: '/resources', feature: 'enableResourceCenter' },
];

const workSubItems = [
  { key: 'workboard', label: 'Workboard', path: '/admin/workboard', feature: 'enableWorkboard', adminOnly: true },
  { key: 'tickets', label: 'Tickets', path: '/admin/tickets', feature: 'enableTicketing', adminOnly: true },
  { key: 'assets', label: 'Assets', path: '/admin/assets', feature: 'enableAssetManagement', adminOnly: true },
];

const serviceSubItems = [
  { key: 'ceremony', label: 'Ceremony', path: '/services?category=CEREMONY' },
  { key: 'education', label: 'Education', path: '/services?category=EDUCATION' },
  { key: 'counseling', label: 'Counseling', path: '/services?category=COUNSELING' },
  { key: 'facility', label: 'Facilities', path: '/services?category=FACILITY' },
  { key: 'other', label: 'Other', path: '/services?category=OTHER' },
];

const donationsSubItems = [
  { key: 'give', label: 'Give Now', path: '/donations' },
  { key: 'funds', label: 'Funds', path: '/donations/funds' },
  { key: 'pledges', label: 'My Pledges', path: '/donations/pledges', feature: 'enableRecurringPledges' },
];

export default function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);

  // Detect if we're on a tenant page
  const isTenantPage = pathname?.startsWith('/tenants/');
  const tenantId = isTenantPage ? pathname.split('/')[2] : null;
  const basePath = tenantId ? `/tenants/${tenantId}` : '';

  // Fetch tenant settings when on tenant pages
  useEffect(() => {
    if (!tenantId) {
      setTenantSettings(null);
      setIsAdmin(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/tenants/${tenantId}/me`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            const tenantIsAdmin = Boolean(data?.permissions?.isAdmin);
            const platformAdmin = Boolean((session as any)?.user?.isSuperAdmin);
            setIsAdmin(tenantIsAdmin || platformAdmin);
          }
        }
      } catch (e) {
        // ignore
      }
      try {
        const tRes = await fetch(`/api/tenants/${tenantId}`);
        if (tRes.ok) {
          const tData = await tRes.json();
          if (mounted) setTenantSettings(tData?.settings || null);
        }
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [tenantId, session]);

  // Close sheet on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isFeatureEnabled = (feature?: string) => {
    if (!feature) return true;
    if (!tenantSettings) return true; // Show by default if settings haven't loaded
    return Boolean(tenantSettings[feature as keyof TenantSettings]);
  };

  const handleNavClick = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const renderNavLink = (href: string, label: string, indent: boolean = false) => {
    const isActive = pathname === href || pathname?.startsWith(href + '/');
    return (
      <button
        key={href}
        onClick={() => handleNavClick(href)}
        className={`w-full text-left block px-4 py-3 text-base transition-colors ${indent ? 'pl-8' : ''
          } ${isActive
            ? 'tenant-bg-50 tenant-text-primary font-medium'
            : 'text-foreground hover:bg-muted'
          }`}
      >
        {label}
      </button>
    );
  };

  const renderExpandableSection = (
    key: string,
    label: string,
    href: string,
    items: { key: string; label: string; path: string; feature?: string }[]
  ) => {
    const isExpanded = expandedSections[key];
    const enabledItems = items.filter((item) => isFeatureEnabled(item.feature));

    if (enabledItems.length === 0) return null;

    return (
      <div key={key}>
        <button
          onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between px-4 py-3 text-base text-foreground hover:bg-muted"
        >
          <span>{label}</span>
          <svg
            className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''
              }`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <div className="bg-muted/50">
            {enabledItems.map((item) =>
              renderNavLink(`${basePath}${item.path}`, item.label, true)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTenantNav = () => (
    <div className="flex flex-col">
      {/* Tenant Home */}
      {renderNavLink(basePath, 'Home')}

      {/* Content Section */}
      {renderExpandableSection('content', 'Content', `${basePath}/content`, contentSubItems)}

      {/* Community Section */}
      {renderExpandableSection('community', 'Community', `${basePath}/community`, communitySubItems)}

      {/* Work Section (Admin only) */}
      {isAdmin && renderExpandableSection('work', 'Work', `${basePath}/admin/workboard`, workSubItems)}

      {/* Services Section */}
      {isFeatureEnabled('enableServices') &&
        renderExpandableSection('services', 'Services', `${basePath}/services`, serviceSubItems)}

      {/* Donations Section */}
      {isFeatureEnabled('enableDonations') &&
        renderExpandableSection('donations', 'Donations', `${basePath}/donations`, donationsSubItems)}

      {/* Contact */}
      {renderNavLink(`${basePath}/contact`, 'Contact Us')}

      {/* Settings (Admin only) */}
      {isAdmin && (
        <div>
          <button
            onClick={() => toggleSection('settings')}
            className="w-full flex items-center justify-between px-4 py-3 text-base text-foreground hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <span>Settings</span>
              <svg
                className="h-4 w-4 text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </span>
            <svg
              className={`h-5 w-5 text-muted-foreground transition-transform ${expandedSections['settings'] ? 'rotate-180' : ''
                }`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections['settings'] && (
            <div className="bg-muted/50">
              {CONTROL_PANEL_TABS.map((tab) => {
                const slug = tab.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                return renderNavLink(`${basePath}/settings?category=${slug}`, tab, true);
              })}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-border my-2" />

      {/* Global Links */}
      {renderNavLink('/', 'Asembli Home')}
      {renderNavLink('/explore', 'Explore')}

      {/* Theme Toggle */}
      <div className="border-t border-border my-2" />
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-base text-foreground">Theme</span>
        <ThemeToggle variant="dropdown" size="sm" />
      </div>
    </div>
  );

  const renderGlobalNav = () => (
    <div className="flex flex-col">
      {renderNavLink('/', 'Home')}
      {renderNavLink('/explore', 'Explore')}

      {isAuthenticated && (
        <>
          <div className="border-t border-border my-2" />
          {renderNavLink('/account', 'My Account')}
          {renderNavLink('/notifications', 'Notifications')}
          {renderNavLink('/messages', 'Messages')}
        </>
      )}

      {!isAuthenticated && (
        <>
          <div className="border-t border-border my-2" />
          {renderNavLink('/auth/login', 'Log in')}
          {renderNavLink('/auth/register', 'Create Account')}
        </>
      )}

      {/* Theme Toggle */}
      <div className="border-t border-border my-2" />
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-base text-foreground">Theme</span>
        <ThemeToggle variant="dropdown" size="sm" />
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open navigation menu"
          className={`p-2 rounded-md text-muted-foreground hover:bg-muted md:hidden ${className || ''}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 overflow-y-auto">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl tenant-bg-100 tenant-text-primary">
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                <path fill="currentColor" d="M12 2 2 9l1.5.84V21h6v-6h5v6h6V9.84L22 9z" />
              </svg>
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] tenant-text-primary">
                Asembli
              </span>
              <span className="text-base font-semibold text-foreground">Platform</span>
            </div>
          </SheetTitle>
        </SheetHeader>
        <nav className="py-2" aria-label="Mobile navigation">
          {isTenantPage ? renderTenantNav() : renderGlobalNav()}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
