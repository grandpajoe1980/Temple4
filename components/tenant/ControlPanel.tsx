import React, { useState, useMemo } from 'react';
import type { Tenant, User } from '../../types';
import { TenantRole } from '../../types';
import Tabs from '../ui/Tabs';
import Card from '../ui/Card';
import { CONTROL_PANEL_TABS } from '../../constants';
import GeneralTab from './tabs/GeneralTab';
import BrandingTab from './tabs/BrandingTab';
import FeaturesTab from './tabs/FeaturesTab';
import PermissionsTab from './tabs/PermissionsTab';
import MembershipTab from './tabs/MembershipTab';
import UserProfilesTab from './tabs/UserProfilesTab';
import DonationsTab from './tabs/DonationsTab';
import VolunteeringTab from './tabs/VolunteeringTab';
import SmallGroupsTab from './tabs/SmallGroupsTab';
import LiveStreamTab from './tabs/LiveStreamTab';
import PrayerWallTab from './tabs/PrayerWallTab';
import ResourceCenterTab from './tabs/ResourceCenterTab';
import ContactSubmissionsTab from './tabs/ContactSubmissionsTab';
import { hasRole, can } from '../../lib/permissions';

interface ControlPanelProps {
  tenant: Tenant;
  onUpdate: (tenant: Tenant) => void;
  currentUser: User;
  onImpersonate: (user: User) => void;
  onRefresh: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ tenant, onUpdate, currentUser, onImpersonate, onRefresh }) => {
  const isAdmin = useMemo(() => currentUser.isSuperAdmin || hasRole(currentUser, tenant.id, TenantRole.ADMIN), [currentUser, tenant.id]);

  const availableTabs = useMemo(() => {
    return CONTROL_PANEL_TABS.filter(tab => {
      if (isAdmin) {
        return true; // Admins see all tabs
      }
      // Permissions for non-admins
      switch (tab) {
        case 'Membership & Moderation':
          return can(currentUser, tenant, 'canApproveMembership') || can(currentUser, tenant, 'canBanMembers');
        case 'Prayer Wall':
          return can(currentUser, tenant, 'canManagePrayerWall');
        case 'Resource Center':
          return can(currentUser, tenant, 'canManageResources');
        case 'Contact Submissions':
            return can(currentUser, tenant, 'canManageContactSubmissions');
        default:
          return false; // Hide all other tabs from non-admins
      }
    });
  }, [currentUser, tenant, isAdmin]);
  
  const [activeTab, setActiveTab] = useState(availableTabs[0] || CONTROL_PANEL_TABS[0]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'General':
        return <GeneralTab tenant={tenant} onUpdate={onUpdate} />;
      case 'Branding':
        return <BrandingTab tenant={tenant} onUpdate={onUpdate} />;
      case 'Features':
        return <FeaturesTab tenant={tenant} onUpdate={onUpdate} />;
      case 'Permissions':
        return <PermissionsTab tenant={tenant} onUpdate={onUpdate} currentUser={currentUser} />;
      case 'Membership & Moderation':
        return <MembershipTab tenant={tenant} onUpdate={onUpdate} currentUser={currentUser} onImpersonate={onImpersonate} onRefresh={onRefresh} />;
      case 'User Profiles':
        return <UserProfilesTab tenant={tenant} currentUser={currentUser} onRefresh={onRefresh} />;
      case 'Donations':
        return <DonationsTab tenant={tenant} onUpdate={onUpdate} />;
      case 'Volunteering':
        return <VolunteeringTab tenant={tenant} currentUser={currentUser} onRefresh={onRefresh} />;
      case 'Small Groups':
        return <SmallGroupsTab tenant={tenant} currentUser={currentUser} onRefresh={onRefresh} />;
      case 'Live Stream':
        return <LiveStreamTab tenant={tenant} onUpdate={onUpdate} />;
      case 'Prayer Wall':
        return <PrayerWallTab tenant={tenant} currentUser={currentUser} onRefresh={onRefresh} />;
      case 'Resource Center':
        return <ResourceCenterTab tenant={tenant} currentUser={currentUser} onRefresh={onRefresh} />;
      case 'Contact Submissions':
        return <ContactSubmissionsTab tenant={tenant} currentUser={currentUser} onRefresh={onRefresh} />;
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