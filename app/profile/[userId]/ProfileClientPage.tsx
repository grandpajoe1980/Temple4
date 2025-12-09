'use client';

import { useState, useMemo } from 'react';
import type { User, UserProfile, UserPrivacySettings, AccountSettings } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import ProfileSettingsTab from '@/app/components/account/ProfileSettingsTab';
import PrivacySettingsTab from '@/app/components/account/PrivacySettingsTab';
import AccountSettingsTab from '@/app/components/account/AccountSettingsTab';
import Button from '@/app/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileFeed } from '@/app/components/profile/ProfileFeed';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';

interface ProfileClientPageProps {
  user: User & {
    profile: UserProfile | null;
    privacySettings: UserPrivacySettings | null;
    accountSettings: AccountSettings | null;
  };
}

export default function ProfileClientPage({ user: initialUser }: ProfileClientPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = useMemo(
    () => Boolean(session?.user && (session.user.id === user.id || session.user.isSuperAdmin)),
    [session?.user, user.id],
  );

  const handleUpdate = async (updatedData: Partial<{ profile: UserProfile, privacySettings: UserPrivacySettings, accountSettings: AccountSettings }>) => {
    if (!canEdit) return;

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = body?.message || body?.error || 'Failed to update profile';
        throw new Error(message);
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsEditing(false);
      router.refresh(); // Refresh server components
      alert('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      // Handle error state in UI
      alert('Failed to update profile.');
    }
  };

  if (!user.profile) return <div>This user has not set up their profile.</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <UserLink userId={user.id} className="inline-flex">
            <Avatar src={user.profile?.avatarUrl ?? undefined} name={user.profile?.displayName ?? undefined} size="xl" />
          </UserLink>
          <div>
            <h1 className="text-3xl font-bold">{user.profile?.displayName}</h1>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>
        {canEdit && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>

      {!isEditing ? (
        <div className="bg-white p-6 rounded-lg shadow">
            <p>{user.profile?.bio}</p>
            {/* Display other public profile info here */}
        </div>
      ) : (
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <ProfileSettingsTab
              profile={user.profile}
              onUpdate={(data: Partial<UserProfile>) => handleUpdate({ profile: data as any })}
            />
          </TabsContent>
          <TabsContent value="privacy">
            {user.privacySettings && (
                <PrivacySettingsTab
                    settings={user.privacySettings}
                    onUpdate={(data: UserPrivacySettings) => handleUpdate({ privacySettings: data })}
                />
            )}
          </TabsContent>
          <TabsContent value="account">
             {user.accountSettings && (
                <AccountSettingsTab
                    settings={user.accountSettings}
                    onUpdate={(data: AccountSettings) => handleUpdate({ accountSettings: data })}
                />
             )}
          </TabsContent>
        </Tabs>
      )}
       {isEditing && (
          <div className="mt-4 flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
      )}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Posts</h2>
        <ProfileFeed userId={user.id} isOwnProfile={canEdit} tenantId={user.profile?.tenantId ?? null} />
      </div>
    </div>
  );
}
