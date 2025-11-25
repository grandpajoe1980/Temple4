"use client"

import React from 'react';
import type { Tenant, DonationSettings } from '@/types';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import ToggleSwitch from '../../ui/ToggleSwitch';

interface DonationsTabProps {
  tenant: Tenant;
  onUpdate: (tenant: Tenant) => void;
  onSave: (updates: any) => Promise<any>;
}

const DEFAULT_SUGGESTED_AMOUNTS = [5, 10, 25, 50, 100];
const defaultDonationSettings: DonationSettings = {
  mode: 'EXTERNAL',
  externalUrl: '',
  currency: 'USD',
  suggestedAmounts: DEFAULT_SUGGESTED_AMOUNTS,
  allowCustomAmounts: true,
  leaderboardEnabled: false,
  leaderboardVisibility: 'PUBLIC',
  leaderboardTimeframe: 'ALL_TIME',
  paypalUrl: '',
  venmoHandle: '',
  zelleEmail: '',
  cashAppTag: '',
  mailingAddress: '',
  taxId: '',
  bankTransferInstructions: '',
  textToGiveNumber: '',
  otherGivingNotes: '',
  otherGivingLinks: [],
};

const DonationsTab: React.FC<DonationsTabProps> = ({ tenant, onUpdate, onSave }) => {
  const [isSaving, setIsSaving] = React.useState(false);
  const settings = { ...defaultDonationSettings, ...(tenant.settings.donationSettings || {}) };
  const suggestedAmounts =
    settings.suggestedAmounts && settings.suggestedAmounts.length > 0
      ? settings.suggestedAmounts
      : DEFAULT_SUGGESTED_AMOUNTS;

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

  const serializeOtherGivingLinks = (links?: Array<{ label: string; url: string }>) =>
    (links || []).map(link => `${link.label} | ${link.url}`).join('\n');

  const handleOtherLinksChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const links = e.target.value
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [label, url] = line.split('|').map(part => part.trim());
        if (!label || !url) return null;
        return { label, url };
      })
      .filter(Boolean) as Array<{ label: string; url: string }>;
    handleSettingsChange('otherGivingLinks', links);
  };

  return (
    <div className="space-y-8">
        <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Donation Settings</h3>
            <p className="mt-1 text-sm text-gray-500">Configure how your community can receive donations. The main “Enable Donations” toggle is in the <span className="font-semibold text-amber-700">Features</span> tab.</p>
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
                value={suggestedAmounts.join(', ')}
                onChange={handleAmountChange}
                placeholder="5, 10, 25, 50, 100"
            />
             <ToggleSwitch
                label="Allow Custom Amounts"
                description="Let donors enter an amount not listed above."
                enabled={settings.allowCustomAmounts}
                onChange={enabled => handleSettingsChange('allowCustomAmounts', enabled)}
            />
        </div>

        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Ways to Give</h3>
          <p className="mt-1 text-sm text-gray-500">Add the giving methods your congregation supports. URLs and handles are shown on the donations page.</p>
        </div>
        <div className="space-y-4">
          <Input
            label="PayPal Link"
            id="paypalUrl"
            name="paypalUrl"
            type="url"
            value={settings.paypalUrl}
            onChange={e => handleSettingsChange('paypalUrl', e.target.value)}
            placeholder="https://www.paypal.com/donate/..."
          />
          <Input
            label="Venmo Handle"
            id="venmoHandle"
            name="venmoHandle"
            value={settings.venmoHandle}
            onChange={e => handleSettingsChange('venmoHandle', e.target.value)}
            placeholder="@yourchurch"
          />
          <Input
            label="Zelle Email"
            id="zelleEmail"
            name="zelleEmail"
            type="email"
            value={settings.zelleEmail}
            onChange={e => handleSettingsChange('zelleEmail', e.target.value)}
            placeholder="giving@yourchurch.org"
          />
          <Input
            label="Cash App Tag"
            id="cashAppTag"
            name="cashAppTag"
            value={settings.cashAppTag}
            onChange={e => handleSettingsChange('cashAppTag', e.target.value)}
            placeholder="$YourChurch"
          />
          <Input
            label="Text-to-Give Number"
            id="textToGiveNumber"
            name="textToGiveNumber"
            value={settings.textToGiveNumber}
            onChange={e => handleSettingsChange('textToGiveNumber', e.target.value)}
            placeholder="(555) 123-4567"
          />
          <div>
            <label htmlFor="mailingAddress" className="block text-sm font-medium text-gray-700 mb-1">Mailing Address for Checks</label>
            <textarea
              id="mailingAddress"
              name="mailingAddress"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
              rows={3}
              value={settings.mailingAddress}
              onChange={e => handleSettingsChange('mailingAddress', e.target.value)}
              placeholder={"123 Main St\nCity, ST 12345"}
            />
          </div>
          <div>
            <label htmlFor="bankTransferInstructions" className="block text-sm font-medium text-gray-700 mb-1">Bank Transfer / ACH Instructions</label>
            <textarea
              id="bankTransferInstructions"
              name="bankTransferInstructions"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
              rows={3}
              value={settings.bankTransferInstructions}
              onChange={e => handleSettingsChange('bankTransferInstructions', e.target.value)}
              placeholder="Routing number, account number, and any notes."
            />
          </div>
          <Input
            label="Tax ID / EIN"
            id="taxId"
            name="taxId"
            value={settings.taxId}
            onChange={e => handleSettingsChange('taxId', e.target.value)}
            placeholder="12-3456789"
          />
          <div>
            <label htmlFor="otherGivingLinks" className="block text-sm font-medium text-gray-700 mb-1">Other Giving Links (one per line, Label | URL)</label>
            <textarea
              id="otherGivingLinks"
              name="otherGivingLinks"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
              rows={3}
              value={serializeOtherGivingLinks(settings.otherGivingLinks)}
              onChange={handleOtherLinksChange}
              placeholder={"Cryptocurrency | https://yourlink\nEmployer Matching | https://matching.example.com"}
            />
          </div>
          <div>
            <label htmlFor="otherGivingNotes" className="block text-sm font-medium text-gray-700 mb-1">Other Instructions</label>
            <textarea
              id="otherGivingNotes"
              name="otherGivingNotes"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
              rows={3}
              value={settings.otherGivingNotes}
              onChange={e => handleSettingsChange('otherGivingNotes', e.target.value)}
              placeholder="e.g., stock donations, in-service giving boxes, planned giving."
            />
          </div>
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
            <Button
              disabled={isSaving}
              onClick={async () => {
                try {
                  setIsSaving(true);
                  await onSave({ settings: { ...tenant.settings } });
                  alert('Donation settings saved');
                } catch (error: any) {
                  alert(error.message || 'Failed to save donation settings');
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
    </div>
  );
};

export default DonationsTab;
