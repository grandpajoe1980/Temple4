"use client"

import React, { useState, useMemo } from 'react';
import { TenantRole } from '@/types';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Card from '../ui/Card';
import { CONTROL_PANEL_TABS } from '@/constants';
import GeneralTab from './tabs/GeneralTab';
import BrandingTab from './tabs/BrandingTab';
import FeaturesTab from './tabs/FeaturesTab';
import PermissionsTab from './tabs/PermissionsTab';
import MembershipTab from './tabs/MembershipTab';
import UserProfilesTab from './tabs/UserProfilesTab';
import DonationsTab from './tabs/DonationsTab';
import VolunteeringTab from './tabs/VolunteeringTab';
import SmallGroupsTab from './tabs/SmallGroupsTab';
import ServicesTab from './tabs/ServicesTab';
import FacilitiesTab from './tabs/FacilitiesTab';
import LiveStreamTab from './tabs/LiveStreamTab';
import PrayerWallTab from './tabs/PrayerWallTab';
import ResourceCenterTab from './tabs/ResourceCenterTab';
import ContactSubmissionsTab from './tabs/ContactSubmissionsTab';
import TripsTab from './tabs/TripsTab';

// Tabs that link to separate admin pages
const STANDALONE_TABS: Record<string, string> = {
  'Localization': '/admin/localization',
  'Member Notes': '/admin/member-notes',
  'Memorials': '/admin/memorials',
  'Tickets': '/admin/tickets',
  'Vanity Domains': '/admin/vanity-domains',
  'Workboard': '/admin/workboard',
};

interface ControlPanelProps {
  tenant: any; // Has architectural issues, needs refactoring
  onUpdate: (tenant: any) => void;
  onSave: (updates: any) => Promise<any>;
  currentUser?: any | null;
  onImpersonate: (user: any) => void;
  onRefresh: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ tenant, onUpdate, onSave, currentUser, onImpersonate, onRefresh }) => {
  const [permissions, setPermissions] = React.useState<Record<string, boolean> | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/me`);
        if (!res.ok) return;
        const json = await res.json();
        setPermissions(json?.permissions ?? null);
        const membership = json?.membership ?? null;
        const admin = currentUser.isSuperAdmin || (membership && membership.roles && membership.roles.some((r: any) => r.role === TenantRole.ADMIN));
        setIsAdmin(Boolean(admin));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [currentUser, tenant.id]);

  const availableTabs = useMemo(() => {
    const filtered = CONTROL_PANEL_TABS.filter(tab => {
      if (isAdmin) {
        return true; // Admins see all tabs
      }
      // Permissions for non-admins
      if (!currentUser) {
        return false;
      }
      switch (tab) {
        case 'Membership & Moderation':
          return Boolean(permissions?.canApproveMembership) || Boolean(permissions?.canBanMembers);
        case 'Prayer Wall':
          return Boolean(permissions?.canManagePrayerWall);
        case 'Resource Center':
          return Boolean(permissions?.canManageResources);
        case 'Contact Submissions':
          return Boolean(permissions?.canManageContactSubmissions);
        case 'Services':
          return Boolean(permissions?.canManageServices);
        case 'Facilities':
          return Boolean(permissions?.canManageFacilities);
        default:
          return false; // Hide all other tabs from non-admins
      }
    });

    // Reorder settings tabs so important items appear at the top in a specific order
    const preferredOrder = ['General', 'Features', 'Permissions', 'Membership & Moderation'];
    const ordered: string[] = [];
    // Add preferred tabs first if present
    for (const p of preferredOrder) {
      if (filtered.includes(p)) ordered.push(p);
    }
    // Add remaining tabs in their existing order
    for (const t of filtered) {
      if (!ordered.includes(t)) ordered.push(t);
    }

    return ordered;
  }, [currentUser, isAdmin, permissions]);

  const [activeTab, setActiveTab] = useState(availableTabs[0] || 'General');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const slugFor = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Sync active tab with ?category=slug if present
  React.useEffect(() => {
    const cat = searchParams?.get('category');
    if (!cat) return;
    const match = (availableTabs || CONTROL_PANEL_TABS).find((t) => slugFor(t) === cat);
    if (match) setActiveTab(match);
  }, [searchParams, availableTabs]);

  const handleTabClick = (tab: string) => {
    if (STANDALONE_TABS[tab]) {
      router.push(`/tenants/${tenant.id}${STANDALONE_TABS[tab]}`);
    } else {
      setActiveTab(tab);
      router.push(`/tenants/${tenant.id}/settings?category=${slugFor(tab)}`, { scroll: false });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'General':
        return <GeneralTab tenant={tenant} onUpdate={onUpdate} onSave={onSave} />;
      case 'Branding':
        return <BrandingTab tenant={tenant} onUpdate={onUpdate} onSave={onSave} />;
      case 'Features':
        return <FeaturesTab tenant={tenant} onUpdate={onUpdate} onSave={onSave} onRefresh={onRefresh} />;
      case 'Permissions':
        return currentUser ? (
          <PermissionsTab tenant={tenant} onUpdate={onUpdate} currentUser={currentUser} />
        ) : null;
      case 'Membership & Moderation':
        return currentUser ? (
          <MembershipTab tenant={tenant} onUpdate={onUpdate} onSave={onSave} currentUser={currentUser} onImpersonate={onImpersonate} onRefresh={onRefresh} />
        ) : null;
      case 'User Profiles':
        return currentUser ? (
          <UserProfilesTab tenant={tenant} currentUser={currentUser} onRefresh={onRefresh} />
        ) : null;
      case 'Donations':
        return <DonationsTab tenant={tenant} onUpdate={onUpdate} onSave={onSave} />;
      case 'Volunteering':
        return currentUser ? (
          <VolunteeringTab tenant={tenant} currentUser={currentUser} onRefresh={onRefresh} />
        ) : null;
      case 'Small Groups':
        return currentUser ? (
          <SmallGroupsTab tenant={tenant} currentUser={currentUser} onRefresh={onRefresh} />
        ) : null;
      case 'Services':
        return currentUser ? (
          <ServicesTab tenant={tenant} onRefresh={onRefresh} />
        ) : null;
      case 'Facilities':
        return currentUser ? (
          <FacilitiesTab tenant={tenant} currentUser={currentUser} onRefresh={onRefresh} />
        ) : null;
      case 'Live Stream':
        return <LiveStreamTab tenant={tenant} onUpdate={onUpdate} onSave={onSave} />;
      case 'Prayer Wall':
        return currentUser ? (
          <PrayerWallTab tenant={tenant} currentUser={currentUser} onRefresh={onRefresh} onUpdate={onUpdate} onSave={onSave} />
        ) : null;
      case 'Resource Center':
        return currentUser ? (
          <ResourceCenterTab tenant={tenant} currentUser={currentUser} onRefresh={onRefresh} />
        ) : null;
      case 'Contact Submissions':
        return currentUser ? (
          <ContactSubmissionsTab tenant={tenant} currentUser={currentUser} onRefresh={onRefresh} />
        ) : null;
      case 'Trips':
        return currentUser ? (
          <TripsTab tenant={tenant} currentUser={currentUser} onRefresh={onRefresh} />
        ) : null;
      default:
        return (
          <div className="text-center py-12 text-gray-500">
            <p>This section has its own dedicated page.</p>
            <button
              onClick={() => handleTabClick(activeTab)}
              className="mt-4 tenant-text-primary hover:text-[color:var(--primary)] font-medium"
            >
              Go to {activeTab} →
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar - hidden on small screens, replaced by hamburger menu */}
      <div className="w-56 flex-shrink-0 hidden sm:block">
        <nav className="sticky top-24 space-y-1">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">Settings</h3>
          </div>
          {availableTabs.map((tab) => {
            const isActive = activeTab === tab;
            const isStandalone = !!STANDALONE_TABS[tab];
            return (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${isActive
                  ? 'tenant-bg-50 tenant-text-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <span>{tab}</span>
                {isStandalone && (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <Card className="!p-0">
          <div className="px-4 pt-4 border-b border-gray-100 pb-4 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{activeTab}</h2>
              <p className="mt-1 text-sm text-gray-500">Manage {activeTab.toLowerCase()} settings for {tenant.name}.</p>
            </div>
            {/* Mobile hamburger to open the sidebar menu on small screens */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen((s) => !s)}
                aria-expanded={mobileMenuOpen}
                aria-label="Open settings menu"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-6">{renderTabContent()}</div>
        </Card>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute left-4 top-20 w-[90%] max-w-xs bg-white dark:bg-[color:var(--card)] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
              <div className="mb-2 px-1">
                <h3 className="text-sm font-semibold text-gray-600">Settings</h3>
              </div>
              <nav className="space-y-1">
                {availableTabs.map((tab) => {
                  const isActive = activeTab === tab;
                  const isStandalone = !!STANDALONE_TABS[tab];
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleTabClick(tab);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${isActive ? 'tenant-bg-50 tenant-text-primary font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <span>{tab}</span>
                      {isStandalone && (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;