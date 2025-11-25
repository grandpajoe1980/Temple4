"use client"

import React, { useState, useMemo } from 'react';
import { TenantRole } from '@/types';
import Tabs from '../ui/Tabs';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
    return CONTROL_PANEL_TABS.filter(tab => {
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
        case 'Facilities':
          return Boolean(permissions?.canManageFacilities);
        default:
          return false; // Hide all other tabs from non-admins
      }
    });
  }, [currentUser, isAdmin, permissions]);
  
  const [activeTab, setActiveTab] = useState(availableTabs[0] || CONTROL_PANEL_TABS[0]);
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
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="sticky z-10 -mx-4 sm:-mx-6 lg:-mx-8" style={{ top: 'var(--site-header-height)' }}>
        <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap gap-3">
            {(availableTabs || CONTROL_PANEL_TABS).map((tab) => {
              const slug = slugFor(tab);
              const isActive = tab === activeTab;
              return (
                <Link
                  key={tab}
                  href={`/tenants/${tenant.id}/settings${slug ? `?category=${slug}` : ''}`}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${isActive ? 'border-amber-500 bg-amber-100 text-amber-800' : 'border-gray-200 text-gray-600 hover:border-amber-300'}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <Card className="!p-0">
        <div className="px-6 pt-6">
          <h2 className="text-2xl font-bold text-gray-900">Control Panel</h2>
          <p className="mt-1 text-sm text-gray-500">Manage settings for {tenant.name}.</p>
        </div>
        <div className="p-6">{renderTabContent()}</div>
      </Card>
    </div>
  );
};

export default ControlPanel;