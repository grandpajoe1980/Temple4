"use client"

import React from 'react';
import type { Tenant, LiveStreamSettings } from '@/types';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import ToggleSwitch from '../../ui/ToggleSwitch';
import useTranslation from '@/app/hooks/useTranslation';

interface LiveStreamTabProps {
  tenant: Tenant;
  onUpdate: (tenant: Tenant) => void;
  onSave: (updates: any) => Promise<any>;
}

const LiveStreamTab: React.FC<LiveStreamTabProps> = ({ tenant, onUpdate, onSave }) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = React.useState(false);
  const settings = tenant.settings.liveStreamSettings;

  const handleSettingsChange = (field: keyof LiveStreamSettings, value: any) => {
    onUpdate({
      ...tenant,
      settings: {
        ...tenant.settings,
        liveStreamSettings: {
          ...settings,
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.liveStream.title')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('settings.liveStream.description')}</p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">{t('settings.liveStream.provider')}</label>
          <select
            id="provider"
            name="provider"
            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] sm:text-sm bg-white text-gray-900"
            value={settings.provider}
            onChange={(e) => handleSettingsChange('provider', e.target.value as LiveStreamSettings['provider'])}
          >
            <option value="YOUTUBE">YouTube</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="VIMEO">Vimeo</option>
            <option value="OTHER">{t('settings.liveStream.otherProvider')}</option>
          </select>
        </div>

        <Input
          label={t('settings.liveStream.embedUrl')}
          id="embedUrl"
          name="embedUrl"
          type="url"
          value={settings.embedUrl || ''}
          onChange={e => handleSettingsChange('embedUrl', e.target.value)}
          placeholder="https://www.youtube.com/embed/..."
        />
      </div>

      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.liveStream.goLive')}</h3>
      </div>
      <ToggleSwitch
        label={t('settings.liveStream.wereLive')}
        description={t('settings.liveStream.wereLiveDesc')}
        enabled={settings.isLive}
        onChange={enabled => handleSettingsChange('isLive', enabled)}
      />

      <div className="text-right border-t border-gray-200 pt-6">
        <Button
          disabled={isSaving}
          onClick={async () => {
            try {
              setIsSaving(true);
              await onSave({ settings: { ...tenant.settings } });
              alert(t('settings.liveStream.saved'));
            } catch (error: any) {
              alert(error.message || t('settings.liveStream.saveFailed'));
            } finally {
              setIsSaving(false);
            }
          }}
        >
          {isSaving ? t('common.saving') : t('settings.saveChanges')}
        </Button>
      </div>
    </div>
  );
};

export default LiveStreamTab;
