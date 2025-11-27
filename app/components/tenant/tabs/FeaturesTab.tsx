"use client"

import React from 'react';
import type { Tenant } from '@/types';
import ToggleSwitch from '../../ui/ToggleSwitch';
import Button from '../../ui/Button';

interface FeaturesTabProps {
  tenant: Tenant;
  onUpdate: (tenant: Tenant) => void;
  onSave: (updates: any) => Promise<any>;
  onRefresh?: () => void;
}

const FeaturesTab: React.FC<FeaturesTabProps> = ({ tenant, onUpdate, onSave, onRefresh }) => {
  const [isSaving, setIsSaving] = React.useState(false);
  const formatLabel = (key: string) => {
    return key.replace('enable', '').replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  };

  const handleFeatureToggle = (feature: keyof Omit<Tenant['settings'], 'isPublic' | 'membershipApprovalMode' | 'visitorVisibility' | 'donationSettings' | 'liveStreamSettings'>, enabled: boolean) => {
    onUpdate({
      ...tenant,
      settings: {
        ...tenant.settings,
        [feature]: enabled,
      },
    });
  };

  const handleVisibilityToggle = (feature: keyof Tenant['settings']['visitorVisibility'], enabled: boolean) => {
    onUpdate({
      ...tenant,
      settings: {
        ...tenant.settings,
        visitorVisibility: {
          ...tenant.settings.visitorVisibility,
          [feature]: enabled,
        },
      },
    });
  };

  const featureKeys = (['enableBooks', 'enableCalendar', 'enableComments', 'enableDonations', 'enableGroupChat', 'enableLiveStream', 'enableMemberDirectory', 'enablePodcasts', 'enablePhotos', 'enablePosts', 'enablePrayerWall', 'enableReactions', 'enableResourceCenter', 'enableServices', 'enableSermons', 'enableSmallGroups', 'enableTrips', 'enableTripFundraising', 'enableVolunteering', 'enableBirthdays'] satisfies Array<keyof Omit<
    Tenant['settings'],
    'isPublic' | 'membershipApprovalMode' | 'visitorVisibility' | 'donationSettings' | 'liveStreamSettings'
  >>).sort((a, b) => formatLabel(a).localeCompare(formatLabel(b)));

  const visibilityKeys = Object.keys(tenant.settings.visitorVisibility) as (keyof Tenant['settings']['visitorVisibility'])[];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Feature Toggles</h3>
        <p className="mt-1 text-sm text-gray-500">Enable or disable major features for your members.</p>
      </div>
      <div className="space-y-4">
        {featureKeys.map((key) => (
          <ToggleSwitch
            key={key}
            label={formatLabel(key)}
            enabled={tenant.settings[key] ?? false}
            onChange={(enabled) => handleFeatureToggle(key, enabled)}
          />
        ))}
      </div>
      
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Visitor Visibility</h3>
        <p className="mt-1 text-sm text-gray-500">Control what non-members can see. Features must be enabled above to be visible.</p>
      </div>
       <div className="space-y-4">
        {visibilityKeys.map((key) => (
          <ToggleSwitch
            key={`vis-${key}`}
            label={`Show ${formatLabel(key)} to Visitors`}
            enabled={tenant.settings.visitorVisibility[key] && (tenant.settings as any)[`enable${key.charAt(0).toUpperCase() + key.slice(1)}`]}
            onChange={(enabled) => handleVisibilityToggle(key, enabled)}
          />
        ))}
      </div>

      <div className="text-right border-t border-gray-200 pt-6">
        <Button
          disabled={isSaving}
          onClick={async () => {
            try {
              setIsSaving(true);
              await onSave({ settings: { ...tenant.settings } });
              onRefresh?.();
              alert('Features saved');
            } catch (error: any) {
              alert(error.message || 'Failed to save features');
            } finally {
              setIsSaving(false);
            }
          }}
        >
          {isSaving ? 'Saving...' : 'Save Feature Settings'}
        </Button>
      </div>
    </div>
  );
};

export default FeaturesTab;
