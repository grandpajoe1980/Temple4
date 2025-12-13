"use client"

import React from 'react';
import type { Tenant } from '@/types';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import ToggleSwitch from '../../ui/ToggleSwitch';
import useTranslation from '@/app/hooks/useTranslation';

interface GeneralTabProps {
  tenant: Tenant;
  onUpdate: (tenant: Tenant) => void;
  onSave: (updates: any) => Promise<any>;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ tenant, onUpdate, onSave }) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onUpdate({ ...tenant, [name]: value });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdate({
      ...tenant,
      address: { ...(tenant.address || {}), [name]: value },
    });
  };

  const handleToggle = (isPublic: boolean) => {
    onUpdate({
      ...tenant,
      settings: { ...tenant.settings, isPublic }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.general.basicInfo')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('settings.general.basicInfoDesc')}</p>
      </div>
      <div className="space-y-6">
        <Input label={t('settings.general.templeName')} id="name" name="name" value={tenant.name} onChange={handleInputChange} />
        <Input label={t('settings.general.creed')} id="creed" name="creed" value={tenant.creed} onChange={handleInputChange} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label={t('settings.general.contactEmail')} id="contactEmail" name="contactEmail" type="email" value={tenant.contactEmail || ''} onChange={handleInputChange} />
          <Input label={t('settings.general.phoneNumber')} id="phoneNumber" name="phoneNumber" type="tel" value={tenant.phoneNumber || ''} onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">{t('settings.general.description')}</label>
          <textarea
            id="description" name="description" rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] sm:text-sm bg-white text-gray-900"
            value={tenant.description} onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.general.location')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('settings.general.locationDesc')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input containerClassName="md:col-span-2" label={t('settings.general.streetAddress')} id="street" name="street" value={tenant.address?.street || ''} onChange={handleAddressChange} />
        <Input label={t('settings.general.city')} id="city" name="city" value={tenant.address?.city || ''} onChange={handleAddressChange} />
        <Input label={t('settings.general.state')} id="state" name="state" value={tenant.address?.state || ''} onChange={handleAddressChange} />
        <Input label={t('settings.general.country')} id="country" name="country" value={tenant.address?.country || ''} onChange={handleAddressChange} />
        <Input label={t('settings.general.postalCode')} id="postalCode" name="postalCode" value={tenant.address?.postalCode || ''} onChange={handleAddressChange} />
      </div>

      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.general.visibility')}</h3>
      </div>
      <ToggleSwitch
        label={t('settings.general.publicTenant')}
        description={t('settings.general.publicTenantDesc')}
        enabled={tenant.settings?.isPublic ?? false}
        onChange={handleToggle}
      />

      <div className="text-right border-t border-gray-200 pt-6">
        <Button
          disabled={isSaving}
          onClick={async () => {
            try {
              setIsSaving(true);
              await onSave({
                name: tenant.name,
                creed: tenant.creed,
                contactEmail: tenant.contactEmail,
                phoneNumber: tenant.phoneNumber,
                description: tenant.description,
                street: tenant.address?.street,
                city: tenant.address?.city,
                state: tenant.address?.state,
                country: tenant.address?.country,
                postalCode: tenant.address?.postalCode,
                settings: tenant.settings ? { ...tenant.settings } : undefined,
              });
              alert(t('settings.saved'));
            } catch (error: any) {
              alert(error.message || t('settings.saveFailed'));
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

export default GeneralTab;