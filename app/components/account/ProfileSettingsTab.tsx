"use client"

import React, { useState } from 'react';
import type { UserProfile } from '@prisma/client';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

interface ProfileSettingsTabProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

const ProfileSettingsTab: React.FC<ProfileSettingsTabProps> = ({ profile: initialProfile, onUpdate }) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleLanguagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev: any) => ({ ...prev, languages: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Call onUpdate which should handle the API call
      await onUpdate(profile);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Information</h3>
        <p className="mt-1 text-sm text-gray-500">This information will be displayed on your public profile.</p>
      </div>
      <div className="space-y-6">
        <Input 
          label="Display Name" 
          id="displayName" 
          name="displayName" 
          value={profile.displayName} 
          onChange={handleInputChange} 
          required
          disabled={isSubmitting}
        />
        <Input 
          label="Avatar URL" 
          id="avatarUrl" 
          name="avatarUrl" 
          type="url"
          value={profile.avatarUrl || ''} 
          onChange={handleInputChange}
          disabled={isSubmitting}
        />
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            value={profile.bio || ''}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="City" 
            id="locationCity" 
            name="locationCity" 
            value={profile.locationCity || ''} 
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
          <Input 
            label="Country" 
            id="locationCountry" 
            name="locationCountry" 
            value={profile.locationCountry || ''} 
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </div>
        <Input 
          label="Languages" 
          id="languages" 
          name="languages" 
          value={profile.languages || ''} 
          onChange={handleLanguagesChange} 
          placeholder="e.g., English, Spanish, German"
          disabled={isSubmitting}
        />
      </div>

      <div className="text-right border-t border-gray-200 pt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default ProfileSettingsTab;
