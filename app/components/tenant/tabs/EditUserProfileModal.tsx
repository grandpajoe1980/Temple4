"use client"

import React, { useState, useEffect } from 'react';
import type { User, EnrichedMember, UserProfile } from '@/types';
import { adminUpdateUserProfile } from '@/lib/data';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Input from '../../ui/Input';

interface EditUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: EnrichedMember;
  adminUser: User;
  onSave: () => void;
}

const EditUserProfileModal: React.FC<EditUserProfileModalProps> = ({ isOpen, onClose, member, adminUser, onSave }) => {
  const [profile, setProfile] = useState<UserProfile>(member.profile);

  useEffect(() => {
    if (member) {
      setProfile(member.profile);
    }
  }, [member]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleLanguagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const languages = e.target.value.split(',').map(lang => lang.trim()).filter(Boolean);
    setProfile((prev: any) => ({ ...prev, languages }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adminUpdateUserProfile(member.id, profile);
    onSave();
    alert('Profile updated by admin.');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Profile for ${member.profile.displayName}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input 
          label="Display Name" 
          id="displayName" 
          name="displayName" 
          value={profile.displayName} 
          onChange={handleInputChange} 
          required 
        />
        <Input 
          label="Avatar URL" 
          id="avatarUrl" 
          name="avatarUrl" 
          type="url"
          value={profile.avatarUrl || ''} 
          onChange={handleInputChange} 
        />
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
            value={profile.bio || ''}
            onChange={handleInputChange}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="City" 
            id="locationCity" 
            name="locationCity" 
            value={profile.locationCity || ''} 
            onChange={handleInputChange} 
          />
          <Input 
            label="Country" 
            id="locationCountry" 
            name="locationCountry" 
            value={profile.locationCountry || ''} 
            onChange={handleInputChange} 
          />
        </div>
        <Input 
          label="Languages (comma-separated)" 
          id="languages" 
          name="languages" 
          value={(profile.languages || []).join(', ')} 
          onChange={handleLanguagesChange} 
          placeholder="e.g., English, Spanish"
        />
        
        <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserProfileModal;
