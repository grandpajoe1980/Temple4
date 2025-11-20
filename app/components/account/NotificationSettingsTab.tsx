"use client"

import React, { useState } from 'react';
import type { User, NotificationPreferences } from '@/types';
import Button from '../ui/Button';
import ToggleSwitch from '../ui/ToggleSwitch';

interface NotificationSettingsTabProps {
  user: User;
  onRefresh: () => void;
}

const NotificationSettingsTab: React.FC<NotificationSettingsTabProps> = ({ user, onRefresh }) => {
  const defaultPrefs: NotificationPreferences = {
    email: {
      newAnnouncement: false,
      newEvent: false,
      directMessage: false,
      groupChatMessage: false,
      membershipUpdate: false,
    }
  };
  const [prefs, setPrefs] = useState<NotificationPreferences>(user.notificationPreferences ?? defaultPrefs);

  const handleToggleChange = (
    category: keyof NotificationPreferences,
    key: keyof NotificationPreferences['email'],
    value: boolean
  ) => {
    setPrefs(prev => ({
      ... (prev || defaultPrefs),
      [category]: {
        ...((prev && prev[category]) || defaultPrefs[category]),
        [key]: value,
      }
    } as NotificationPreferences));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationPreferences: prefs }),
        });
        if (!res.ok) throw new Error('Failed to update notification preferences');
        onRefresh();
        alert('Notification settings updated successfully!');
      } catch (err) {
        console.error(err);
        alert('Failed to update notification settings. Please try again.');
      }
    })();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Email Notifications</h3>
        <p className="mt-1 text-sm text-gray-500">Choose which emails you want to receive.</p>
      </div>
      
      <div className="space-y-6">
        <h4 className="text-md font-semibold text-gray-700">Community Updates</h4>
        <ToggleSwitch
          label="New Announcements"
          description="Receive an email when a new announcement is posted in a tenant you belong to."
          enabled={prefs.email.newAnnouncement}
          onChange={(enabled) => handleToggleChange('email', 'newAnnouncement', enabled)}
        />
        <ToggleSwitch
          label="New Events"
          description="Get notified when a new event is scheduled in your communities."
          enabled={prefs.email.newEvent}
          onChange={(enabled) => handleToggleChange('email', 'newEvent', enabled)}
        />
        <ToggleSwitch
          label="Membership Updates"
          description="Be notified when your request to join a tenant is approved or rejected."
          enabled={prefs.email.membershipUpdate}
          onChange={(enabled) => handleToggleChange('email', 'membershipUpdate', enabled)}
        />
        
        <div className="border-t border-gray-200 pt-6">
             <h4 className="text-md font-semibold text-gray-700">Messaging</h4>
        </div>
         <ToggleSwitch
          label="Direct Messages"
          description="Receive an email when someone sends you a direct message."
          enabled={prefs.email.directMessage}
          onChange={(enabled) => handleToggleChange('email', 'directMessage', enabled)}
        />
        <ToggleSwitch
          label="Group Chat Messages"
          description="Receive an email for messages in group channels. (Note: This can be a lot of email!)"
          enabled={prefs.email.groupChatMessage}
          onChange={(enabled) => handleToggleChange('email', 'groupChatMessage', enabled)}
        />
      </div>

      <div className="text-right border-t border-gray-200 pt-6">
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
};

export default NotificationSettingsTab;
