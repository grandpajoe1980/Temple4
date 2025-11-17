import React from 'react';
import type { Tenant, DonationSettings } from '@/types';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import ToggleSwitch from '../../ui/ToggleSwitch';

interface DonationsTabProps {
  tenant: Tenant;
  onUpdate: (tenant: Tenant) => void;
}

const DonationsTab: React.FC<DonationsTabProps> = ({ tenant, onUpdate }) => {
  const settings = tenant.settings.donationSettings;

  const handleSettingsChange = (field: keyof DonationSettings, value: any) => {
    onUpdate({
      ...tenant,
      settings: {
        ...tenant.settings,
        donationSettings: {
          ...settings,
          [field]: value,
        },
      },
    });
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const amounts = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      handleSettingsChange('suggestedAmounts', amounts);
  }

  return (
    <div className="space-y-8">
        <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Donation Settings</h3>
            <p className="mt-1 text-sm text-gray-500">Configure how your community can receive donations. The main "Enable Donations" toggle is in the <span className="font-semibold text-amber-700">Features</span> tab.</p>
        </div>
        
        <div className="space-y-6">
            <div>
              <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-1">Donation Mode</label>
              <select
                id="mode"
                name="mode"
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
                value={settings.mode}
                onChange={(e) => handleSettingsChange('mode', e.target.value as 'EXTERNAL' | 'INTEGRATED')}
              >
                <option value="EXTERNAL">External Link (e.g., PayPal, GoFundMe)</option>
                <option value="INTEGRATED">Integrated Form (Mock)</option>
              </select>
            </div>

            {settings.mode === 'EXTERNAL' && (
                <Input 
                    label="External Donation URL"
                    id="externalUrl"
                    name="externalUrl"
                    type="url"
                    value={settings.externalUrl || ''}
                    onChange={e => handleSettingsChange('externalUrl', e.target.value)}
                    placeholder="https://www.paypal.com/donate/..."
                />
            )}
        </div>
        
         <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Donation Form</h3>
            <p className="mt-1 text-sm text-gray-500">Customize the integrated donation form.</p>
        </div>
        <div className="space-y-6">
             <Input 
                label="Currency"
                id="currency"
                name="currency"
                value={settings.currency}
                onChange={e => handleSettingsChange('currency', e.target.value.toUpperCase())}
                placeholder="USD"
                className="w-24"
            />
            <Input 
                label="Suggested Amounts (comma-separated)"
                id="suggestedAmounts"
                name="suggestedAmounts"
                value={settings.suggestedAmounts.join(', ')}
                onChange={handleAmountChange}
                placeholder="10, 25, 50, 100"
            />
             <ToggleSwitch
                label="Allow Custom Amounts"
                description="Let donors enter an amount not listed above."
                enabled={settings.allowCustomAmounts}
                onChange={enabled => handleSettingsChange('allowCustomAmounts', enabled)}
            />
        </div>

        <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Leaderboard</h3>
        </div>
        <div className="space-y-6">
            <ToggleSwitch
                label="Enable Leaderboard"
                description="Show a list of top donors on the donations page."
                enabled={settings.leaderboardEnabled}
                onChange={enabled => handleSettingsChange('leaderboardEnabled', enabled)}
            />
            {settings.leaderboardEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="leaderboardVisibility" className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                      <select id="leaderboardVisibility" name="leaderboardVisibility" className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
                         value={settings.leaderboardVisibility} onChange={e => handleSettingsChange('leaderboardVisibility', e.target.value as 'PUBLIC' | 'MEMBERS_ONLY')}
                      >
                        <option value="MEMBERS_ONLY">Members Only</option>
                        <option value="PUBLIC">Public</option>
                      </select>
                    </div>
                     <div>
                      <label htmlFor="leaderboardTimeframe" className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
                      <select id="leaderboardTimeframe" name="leaderboardTimeframe" className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
                        value={settings.leaderboardTimeframe} onChange={e => handleSettingsChange('leaderboardTimeframe', e.target.value as 'ALL_TIME' | 'YEARLY' | 'MONTHLY')}
                      >
                        <option value="ALL_TIME">All Time</option>
                        <option value="YEARLY">This Year</option>
                        <option value="MONTHLY">This Month</option>
                      </select>
                    </div>
                </div>
            )}
        </div>
        
        <div className="text-right border-t border-gray-200 pt-6">
            <Button onClick={() => alert('Donation settings saved (mock)!')}>Save Changes</Button>
        </div>
    </div>
  );
};

export default DonationsTab;
