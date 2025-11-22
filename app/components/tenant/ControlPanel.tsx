"use client"

import React, { useState, useMemo } from 'react';
import { TenantRole } from '@/types';
import Tabs from '../ui/Tabs';
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
    <Card className="!p-0">
        <div className="px-6 pt-6">
            <h2 className="text-2xl font-bold text-gray-900">Control Panel</h2>
            <p className="mt-1 text-sm text-gray-500">Manage settings for {tenant.name}.</p>
        </div>
        <div className="px-6 mt-4">
             <Tabs tabs={availableTabs} activeTab={activeTab} onTabClick={setActiveTab} />
        </div>
      <div className="p-6">
        {renderTabContent()}
      </div>
    </Card>
  );
};

export default ControlPanel;