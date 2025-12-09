"use client"

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Avatar from '../ui/Avatar';
import UserLink from '../ui/UserLink';
import { useRouter } from 'next/navigation';
import type { User as PrismaUser, UserProfile as PrismaUserProfile } from '@prisma/client';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Tabs from '../ui/Tabs';

// Use any as fallback since Prisma client is outdated
type User = PrismaUser | any;
type UserProfile = PrismaUserProfile | any;
import ProfileSettingsTab from './ProfileSettingsTab';
import PrivacySettingsTab from './PrivacySettingsTab';
import MyMembershipsTab from './MyMembershipsTab';
import NotificationSettingsTab from './NotificationSettingsTab';
import AccountSettingsTab from './AccountSettingsTab';

interface AccountSettingsPageProps {
  user: User & {
    profile: UserProfile | null;
    privacySettings: any;
    accountSettings: any;
  };
}

const TABS = ['Profile', 'Privacy', 'My Memberships', 'Account', 'Notifications'];

const AccountSettingsPage: React.FC<AccountSettingsPageProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRefresh = () => {
    router.refresh();
  };

  const handleUpdate = async (updatedData: Partial<{ profile: any; privacySettings: any; accountSettings: any }>) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = body?.message || body?.error || 'Failed to update profile';
        throw new Error(message);
      }

      const updatedUser = await response.json().catch(() => null);
      handleRefresh();
      return updatedUser;
    } catch (err) {
      throw err;
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Respect a `tab` query param for deterministic testing and deep-linking
  useEffect(() => {
    try {
      const tab = searchParams?.get('tab');
      if (tab && TABS.includes(tab)) {
        setActiveTab(tab);
      }
    } catch (e) {
      // ignore on server
    }
  }, [searchParams]);

  const renderTabContent = () => {
    if (!user.profile) {
      return <div>Profile not found</div>;
    }
    
    switch (activeTab) {
      case 'Profile':
        return <ProfileSettingsTab profile={user.profile} onUpdate={(profile) => handleUpdate({ profile })} />;
      case 'Privacy':
        return <PrivacySettingsTab settings={user.privacySettings || {} as any} onUpdate={(settings) => handleUpdate({ privacySettings: settings })} />;
      case 'My Memberships':
        return <MyMembershipsTab user={user as any} onRefresh={handleRefresh} />;
      case 'Account':
        return <AccountSettingsTab settings={user.accountSettings || {} as any} onUpdate={(settings) => handleUpdate({ accountSettings: settings })} />;
      case 'Notifications':
        return <NotificationSettingsTab user={user as any} onRefresh={handleRefresh} />;
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
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <UserLink userId={user.id} className="inline-flex">
            <Avatar
              src={user.profile?.avatarUrl || '/placeholder-avatar.svg'}
              name={user.profile?.displayName || user.email}
              size="lg"
            />
          </UserLink>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-sm text-gray-500">Manage your profile, privacy, and account preferences.</p>
            <div className="mt-2">
              <Link href={`/profile/${user.id}#posts`} className="text-amber-600 hover:underline text-sm">
                View Profile
              </Link>
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={handleBack}>&larr; Back</Button>
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