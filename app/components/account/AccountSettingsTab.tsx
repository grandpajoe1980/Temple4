'use client';

import React, { useState } from 'react';
import type { AccountSettings } from '@prisma/client';
import Button from '../ui/Button';

interface AccountSettingsTabProps {
  settings: AccountSettings;
  onUpdate: (settings: AccountSettings) => void;
}

const timezones = [
    'Etc/GMT+12', 'Pacific/Midway', 'Pacific/Honolulu',
    'America/Anchorage', 'America/Los_Angeles', 'America/Denver',
    'America/Chicago', 'America/New_York', 'America/Caracas',
    'America/Halifax', 'America/Sao_Paulo', 'Atlantic/South_Georgia',
    'Atlantic/Azores', 'Europe/London', 'Europe/Paris',
    'Europe/Helsinki', 'Asia/Jerusalem', 'Asia/Dubai',
    'Asia/Karachi', 'Asia/Dhaka', 'Asia/Bangkok',
    'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney',
    'Pacific/Auckland',
];

const AccountSettingsTab: React.FC<AccountSettingsTabProps> = ({ settings: initialSettings, onUpdate }) => {
  const [settings, setSettings] = useState<AccountSettings>(initialSettings);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(settings);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Localization</h3>
        <p className="mt-1 text-sm text-gray-500">Set your preferred language, date, and time formats.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="languagePreference" className="block text-sm font-medium text-gray-700 mb-1">
            Language
          </label>
          <select
            id="languagePreference"
            name="languagePreference"
            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
            value={settings.languagePreference || 'en-US'}
            onChange={handleChange}
          >
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
            <option value="fr-FR">Français</option>
          </select>
        </div>

        <div>
          <label htmlFor="timezonePreference" className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            id="timezonePreference"
            name="timezonePreference"
            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
            value={settings.timezonePreference || 'America/New_York'}
            onChange={handleChange}
          >
            {timezones.map(tz => (
              <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-1">
                Date Format
              </label>
              <select
                id="dateFormat"
                name="dateFormat"
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
                value={settings.dateFormat || 'MM/DD/YYYY'}
                onChange={handleChange}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

             <div>
              <label htmlFor="timeFormat" className="block text-sm font-medium text-gray-700 mb-1">
                Time Format
              </label>
              <select
                id="timeFormat"
                name="timeFormat"
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
                value={settings.timeFormat || '12h'}
                onChange={handleChange}
              >
                <option value="12h">12-hour</option>
                <option value="24h">24-hour</option>
              </select>
            </div>
        </div>
      </div>

      <div className="text-right border-t border-gray-200 pt-6">
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
};

export default AccountSettingsTab;