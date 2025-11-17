import React from 'react';
import type { User, Tenant } from '@/types';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface ProfilePageProps {
  profileUser: User;
  affiliatedTenants: Tenant[];
  onBack: () => void;
  currentUser: User;
  onImpersonate: (user: User) => void;
  onSendMessage: (recipientUserId: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profileUser, affiliatedTenants, onBack, currentUser, onImpersonate, onSendMessage }) => {
  const canImpersonate = currentUser.isSuperAdmin && currentUser.id !== profileUser.id;
  const isOwnProfile = currentUser.id === profileUser.id;
  const location = [profileUser.profile.locationCity, profileUser.profile.locationCountry].filter(Boolean).join(', ');

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-10 px-4 sm:px-6 lg:px-8">
      <div>
        <Button variant="secondary" onClick={onBack}>&larr; Back</Button>
      </div>
      
      <Card className="!p-0">
        <div className="p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-8">
            <img 
              src={profileUser.profile.avatarUrl} 
              alt={`${profileUser.profile.displayName}'s avatar`}
              className="w-32 h-32 rounded-full ring-4 ring-white ring-offset-2 ring-offset-amber-100"
            />
            <div className="mt-6 sm:mt-2 text-center sm:text-left">
              <h2 className="text-3xl font-bold text-gray-900">{profileUser.profile.displayName}</h2>
              {location && <p className="mt-1 text-md text-gray-500">{location}</p>}
              <div className="mt-4 flex items-center space-x-3">
                {!isOwnProfile && <Button onClick={() => onSendMessage(profileUser.id)}>Send Message</Button>}
                {canImpersonate && (
                  <Button variant="danger" onClick={() => onImpersonate(profileUser)}>
                    Impersonate User
                  </Button>
                )}
              </div>
            </div>
          </div>
          {profileUser.profile.bio && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">About</h3>
              <p className="mt-2 text-gray-700">{profileUser.profile.bio}</p>
            </div>
          )}
          {profileUser.profile.languages && profileUser.profile.languages.length > 0 && (
            <div className="mt-6">
               <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Languages</h3>
               <div className="mt-2 flex flex-wrap gap-2">
                 {profileUser.profile.languages.map(lang => (
                    <span key={lang} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                        {lang}
                    </span>
                 ))}
               </div>
            </div>
          )}
        </div>
      </Card>

      {profileUser.privacySettings.showAffiliations && affiliatedTenants.length > 0 && (
        <Card title="Affiliated Temples">
          <div className="space-y-4">
            {affiliatedTenants.map(tenant => (
              <div key={tenant.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                 <h4 className="font-semibold text-gray-800">{tenant.name}</h4>
                 <p className="text-sm text-gray-500">{tenant.creed}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;