'use client';

import { useState } from 'react';
import type { User, UserProfile, UserPrivacySettings, AccountSettings } from '@prisma/client';
import { useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';

interface ProfileViewPageProps {
  profileUser: User & {
    profile: UserProfile | null;
    privacySettings: UserPrivacySettings | null;
    accountSettings: AccountSettings | null;
  };
  currentUserId: string;
  isSuperAdmin: boolean;
}

export default function ProfileViewPage({ profileUser, currentUserId, isSuperAdmin }: ProfileViewPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isOwnProfile = currentUserId === profileUser.id;
  const canImpersonate = isSuperAdmin && !isOwnProfile;
  const location = [profileUser.profile?.locationCity, profileUser.profile?.locationCountry]
    .filter(Boolean)
    .join(', ');

  const handleSendMessage = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/conversations/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId: profileUser.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      // Redirect to messages page
      router.push('/messages');
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!confirm(`Are you sure you want to impersonate ${profileUser.profile?.displayName || profileUser.email}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/impersonate/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          targetUserId: profileUser.id,
          reason: 'Profile page impersonation'
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to start impersonation');
      }

      // Refresh the page to reflect the impersonated session
      router.refresh();
    } catch (error: any) {
      console.error('Error starting impersonation:', error);
      alert(error.message || 'Failed to start impersonation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!profileUser.profile) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">Profile Not Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            This user has not set up their profile yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-10 px-4 sm:px-6 lg:px-8">
      <Card className="!p-0">
        <div className="p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-8">
            <img
              src={profileUser.profile?.avatarUrl || '/default-avatar.png'}
              alt={`${profileUser.profile?.displayName || 'User'}'s avatar`}
              className="w-32 h-32 rounded-full ring-4 ring-white ring-offset-2 ring-offset-amber-100"
            />
            <div className="mt-6 sm:mt-2 text-center sm:text-left flex-1">
              <h2 className="text-3xl font-bold text-gray-900">
                {profileUser.profile?.displayName || profileUser.email}
              </h2>
              {location && <p className="mt-1 text-md text-gray-500">{location}</p>}
              <div className="mt-4 flex items-center space-x-3">
                {!isOwnProfile && (
                  <Button onClick={handleSendMessage} disabled={isLoading}>
                    Direct Message
                  </Button>
                )}
                {canImpersonate && (
                  <Button variant="danger" onClick={handleImpersonate} disabled={isLoading}>
                    Impersonate User
                  </Button>
                )}
              </div>
            </div>
          </div>
          {profileUser.profile?.bio && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">About</h3>
              <p className="mt-2 text-gray-700">{profileUser.profile?.bio}</p>
            </div>
          )}
          {profileUser.profile?.languages && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Languages</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {profileUser.profile?.languages.split(',').map((lang: string) => lang.trim()).filter(Boolean).map((lang: string) => (
                  <span
                    key={lang}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
