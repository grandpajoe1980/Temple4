"use client"

import React from 'react';
import type { Tenant } from '@/types';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import ImageUpload from '../../ui/ImageUpload';

interface BrandingTabProps {
  tenant: Tenant;
  onUpdate: (tenant: Tenant) => void;
  onSave: (updates: any) => Promise<any>;
}

const BrandingTab: React.FC<BrandingTabProps> = ({ tenant, onUpdate, onSave }) => {
  const [isSaving, setIsSaving] = React.useState(false);
  
  // Auto-save branding after an upload completes. We keep this local so the
  // ImageUpload component stays generic and the BrandingTab can decide to
  // persist changes immediately (PhotosPage-style behavior).
  const handleAutoSave = async (partialBranding: any) => {
    setIsSaving(true);
    try {
      await onSave({ branding: { ...partialBranding } });
    } catch (error: any) {
      // Use a simple alert for now to surface errors to the admin user.
      alert(error?.message || 'Failed to save branding');
    } finally {
      setIsSaving(false);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdate({
      ...tenant,
      branding: { ...tenant.branding, [name]: value },
    });
  };

  const handleLinkChange = (index: number, field: 'label' | 'url', value: string) => {
    const newLinks = [...tenant.branding.customLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    onUpdate({
      ...tenant,
      branding: { ...tenant.branding, customLinks: newLinks },
    });
  };

  const handleAddLink = () => {
    const newLinks = [...(tenant.branding.customLinks || []), { label: '', url: '' }];
    onUpdate({
      ...tenant,
      branding: { ...tenant.branding, customLinks: newLinks },
    });
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = tenant.branding.customLinks.filter((_, i) => i !== index);
    onUpdate({
      ...tenant,
      branding: { ...tenant.branding, customLinks: newLinks },
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Branding</h3>
        <p className="mt-1 text-sm text-gray-500">Customize the look and feel of your temple's pages.</p>
      </div>

      <div className="space-y-6">
        <ImageUpload
          label="Logo"
          currentImageUrl={tenant.branding.logoUrl}
          onImageUrlChange={async (url) => {
            const updated = { ...tenant.branding, logoUrl: url };
            onUpdate({ ...tenant, branding: updated });
            // Persist immediately (PhotosPage UX): auto-save the branding.
            await handleAutoSave(updated);
          }}
          tenantId={tenant.id}
          category="photos"
          showPreview={true}
          previewClassName="w-32 h-32 object-contain rounded-lg border border-gray-200"
        />
        <ImageUpload
          label="Banner Image"
          currentImageUrl={tenant.branding.bannerImageUrl}
          onImageUrlChange={async (url) => {
            const updated = { ...tenant.branding, bannerImageUrl: url };
            onUpdate({ ...tenant, branding: updated });
            await handleAutoSave(updated);
          }}
          tenantId={tenant.id}
          category="photos"
          showPreview={true}
          previewClassName="w-full max-w-md h-32 object-cover rounded-lg border border-gray-200"
        />
      </div>

      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Colors</h3>
        <p className="mt-1 text-sm text-gray-500">Choose colors that match your community’s identity.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">Primary Color</label>
          <div className="mt-1 flex items-center space-x-3">
            <input type="color" id="primaryColor" name="primaryColor" value={tenant.branding.primaryColor} onChange={handleColorChange} className="h-10 w-10 rounded-md border-gray-300" />
            <Input id="primaryColorText" name="primaryColor" type="text" label="" value={tenant.branding.primaryColor} onChange={handleColorChange} />
          </div>
        </div>
        <div>
          <label htmlFor="accentColor" className="block text-sm font-medium text-gray-700">Accent Color</label>
          <div className="mt-1 flex items-center space-x-3">
            <input type="color" id="accentColor" name="accentColor" value={tenant.branding.accentColor} onChange={handleColorChange} className="h-10 w-10 rounded-md border-gray-300" />
            <Input id="accentColorText" name="accentColor" type="text" label="" value={tenant.branding.accentColor} onChange={handleColorChange} />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Custom Links</h3>
        <p className="mt-1 text-sm text-gray-500">Add custom links to your temple’s public page (e.g., website, donations).</p>
        <p className="mt-1 text-xs text-amber-700">To enable the ‘Donate’ button on your home page, add a link with the exact label “Donate”.</p>
      </div>
      <div className="space-y-4">
        {(tenant.branding.customLinks || []).map((link, index) => (
          <div key={index} className="flex items-end space-x-4">
            <div className="grid grid-cols-2 gap-4 flex-grow">
              <Input
                label="Label"
                id={`linkLabel-${index}`}
                name="label"
                value={link.label}
                onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
                placeholder="e.g., Our Website"
              />
              <Input
                label="URL"
                id={`linkUrl-${index}`}
                name="url"
                type="url"
                value={link.url}
                onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => handleRemoveLink(index)}
              aria-label="Remove link"
              className="!p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={handleAddLink}>+ Add Link</Button>
      </div>

      <div className="text-right border-t border-gray-200 pt-6">
        <Button
          disabled={isSaving}
          onClick={async () => {
            try {
              setIsSaving(true);
              await onSave({ branding: { ...tenant.branding } });
              alert('Branding saved');
            } catch (error: any) {
              alert(error.message || 'Failed to save branding');
            } finally {
              setIsSaving(false);
            }
          }}
        >
          {isSaving ? 'Saving...' : 'Save Branding'}
        </Button>
      </div>
    </div>
  );
};

export default BrandingTab;
