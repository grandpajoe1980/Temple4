import React, { useState } from 'react';
import type { User, UserPrivacySettings } from '../../types';
import { updateUserPrivacySettings } from '../../seed-data';
import Button from '../ui/Button';
import ToggleSwitch from '../ui/ToggleSwitch';

interface PrivacySettingsTabProps {
  user: User;
  onRefresh: () => void;
}

const PrivacySettingsTab: React.FC<PrivacySettingsTabProps> = ({ user, onRefresh }) => {
  const [settings, setSettings] = useState<UserPrivacySettings>(user.privacySettings);

  const handleToggleChange = (key: keyof UserPrivacySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserPrivacySettings(user.id, settings);
    onRefresh();
    alert('Privacy settings updated successfully!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Privacy Settings</h3>
        <p className="mt-1 text-sm text-gray-500">Control what information you share on the platform.</p>
      </div>
      
      <div className="space-y-4">
        <ToggleSwitch
          label="Show Temple Affiliations"
          description="Allow others to see the list of temples you are a member of on your profile."
          enabled={settings.showAffiliations}
          onChange={(enabled) => handleToggleChange('showAffiliations', enabled)}
        />
      </div>

      <div className="text-right border-t border-gray-200 pt-6">
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
};

export default PrivacySettingsTab;
