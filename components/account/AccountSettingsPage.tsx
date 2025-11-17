import React, { useState } from 'react';
import type { User } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Tabs from '../ui/Tabs';
import ProfileSettingsTab from './ProfileSettingsTab';
import PrivacySettingsTab from './PrivacySettingsTab';
import MyMembershipsTab from './MyMembershipsTab';
import NotificationSettingsTab from './NotificationSettingsTab';
import AccountSettingsTab from './AccountSettingsTab';

interface AccountSettingsPageProps {
  user: User;
  onBack: () => void;
  onRefresh: () => void;
}

const TABS = ['Profile', 'Privacy', 'My Memberships', 'Account', 'Notifications'];

const AccountSettingsPage: React.FC<AccountSettingsPageProps> = ({ user, onBack, onRefresh }) => {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Profile':
        return <ProfileSettingsTab user={user} onRefresh={onRefresh} />;
      case 'Privacy':
        return <PrivacySettingsTab user={user} onRefresh={onRefresh} />;
      case 'My Memberships':
        return <MyMembershipsTab user={user} onRefresh={onRefresh} />;
      case 'Account':
        return <AccountSettingsTab user={user} onRefresh={onRefresh} />;
      case 'Notifications':
        return <NotificationSettingsTab user={user} onRefresh={onRefresh} />;
      // Add other tabs here later
      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">{activeTab} Settings</h3>
            <p className="mt-1 text-sm text-gray-500">This section is not yet implemented.</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-500">Manage your profile, privacy, and account preferences.</p>
        </div>
        <Button variant="secondary" onClick={onBack}>&larr; Back</Button>
      </div>
      
      <Card className="!p-0">
        <div className="px-6">
          <Tabs tabs={TABS} activeTab={activeTab} onTabClick={setActiveTab} />
        </div>
        <div className="p-6">
          {renderTabContent()}
        </div>
      </Card>
    </div>
  );
};

export default AccountSettingsPage;