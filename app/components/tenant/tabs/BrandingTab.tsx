"use client"

import React from 'react';
import type { Tenant } from '@/types';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import ImageUpload from '../../ui/ImageUpload';
import ToggleSwitch from '../../ui/ToggleSwitch';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaLinkedin, FaGlobe, FaGripVertical } from 'react-icons/fa';
import { FaTiktok, FaXTwitter } from 'react-icons/fa6';

interface SocialLink {
  platform: string;
  url: string;
  label?: string;
  showInFooter?: boolean;
}

interface BrandingTabProps {
  tenant: Tenant;
  onUpdate: (tenant: Tenant) => void;
  onSave: (updates: any) => Promise<any>;
}

// Supported social media platforms with icons
const SOCIAL_PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: <FaFacebook size={20} /> },
  { id: 'instagram', name: 'Instagram', icon: <FaInstagram size={20} /> },
  { id: 'twitter', name: 'Twitter', icon: <FaTwitter size={20} /> },
  { id: 'x', name: 'X (Twitter)', icon: <FaXTwitter size={20} /> },
  { id: 'youtube', name: 'YouTube', icon: <FaYoutube size={20} /> },
  { id: 'linkedin', name: 'LinkedIn', icon: <FaLinkedin size={20} /> },
  { id: 'tiktok', name: 'TikTok', icon: <FaTiktok size={20} /> },
  { id: 'website', name: 'Website', icon: <FaGlobe size={20} /> },
] as const;

// Get icon for a platform
const getPlatformIcon = (platform: string): React.ReactNode => {
  const found = SOCIAL_PLATFORMS.find((p) => p.id === platform);
  return found?.icon ?? <FaGlobe size={20} />;
};

// Get platform name
const getPlatformName = (platform: string): string => {
  const found = SOCIAL_PLATFORMS.find((p) => p.id === platform);
  return found?.name ?? platform;
};

// Validate HTTPS URL
const isValidHttpsUrl = (url: string): boolean => {
  if (!url) return true; // Empty is valid (not required)
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const BrandingTab: React.FC<BrandingTabProps> = ({ tenant, onUpdate, onSave }) => {
  const [isSaving, setIsSaving] = React.useState(false);
  const [socialLinkErrors, setSocialLinkErrors] = React.useState<Record<number, string>>({});
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [showPlatformPicker, setShowPlatformPicker] = React.useState(false);
  
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

  // Social Links handlers
  const socialLinks = (tenant.branding.socialLinks || []) as SocialLink[];
  
  const handleSocialLinkChange = (index: number, field: keyof SocialLink, value: string | boolean) => {
    const newLinks = [...socialLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    
    // Validate URL if changed
    if (field === 'url' && typeof value === 'string') {
      const errors = { ...socialLinkErrors };
      if (value && !isValidHttpsUrl(value)) {
        errors[index] = 'URL must use HTTPS';
      } else {
        delete errors[index];
      }
      setSocialLinkErrors(errors);
    }
    
    onUpdate({
      ...tenant,
      branding: { ...tenant.branding, socialLinks: newLinks },
    });
  };

  const handleAddSocialLink = (platform: string) => {
    // Check if platform already exists
    if (socialLinks.some((link) => link.platform === platform)) {
      alert(`${getPlatformName(platform)} is already added`);
      return;
    }
    
    const newLink: SocialLink = {
      platform,
      url: '',
      label: getPlatformName(platform),
      showInFooter: true,
    };
    const newLinks = [...socialLinks, newLink];
    onUpdate({
      ...tenant,
      branding: { ...tenant.branding, socialLinks: newLinks },
    });
    setShowPlatformPicker(false);
  };

  const handleRemoveSocialLink = (index: number) => {
    const newLinks = socialLinks.filter((_, i) => i !== index);
    // Clean up any errors for removed link
    const errors = { ...socialLinkErrors };
    delete errors[index];
    setSocialLinkErrors(errors);
    
    onUpdate({
      ...tenant,
      branding: { ...tenant.branding, socialLinks: newLinks },
    });
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newLinks = [...socialLinks];
    const [draggedItem] = newLinks.splice(draggedIndex, 1);
    newLinks.splice(dropIndex, 0, draggedItem);

    onUpdate({
      ...tenant,
      branding: { ...tenant.branding, socialLinks: newLinks },
    });
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Get available platforms (not yet added)
  const availablePlatforms = SOCIAL_PLATFORMS.filter(
    (p) => !socialLinks.some((link) => link.platform === p.id)
  );

  // Check if there are any validation errors
  const hasValidationErrors = Object.keys(socialLinkErrors).length > 0;

  // Live footer preview data
  const previewTenant = {
    name: tenant.name,
    branding: {
      ...tenant.branding,
      socialLinks: socialLinks.filter((link) => link.url && link.showInFooter),
    },
  };

  return (
    <div className="space-y-8">
      <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Branding</h3>
            <p className="mt-1 text-sm text-gray-500">Customize the look and feel of your temple&apos;s pages.</p>
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
        <p className="mt-1 text-sm text-gray-500">Choose colors that match your community&apos;s identity.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">Primary Color</label>
          <div className="mt-1 flex items-center space-x-3">
            <input type="color" id="primaryColor" name="primaryColor" value={tenant.branding.primaryColor ?? '#000000'} onChange={handleColorChange} className="h-10 w-10 rounded-md border-gray-300" />
            <Input id="primaryColorText" name="primaryColor" type="text" label="" value={tenant.branding.primaryColor ?? ''} onChange={handleColorChange} />
          </div>
        </div>
        <div>
          <label htmlFor="accentColor" className="block text-sm font-medium text-gray-700">Accent Color</label>
          <div className="mt-1 flex items-center space-x-3">
            <input type="color" id="accentColor" name="accentColor" value={tenant.branding.accentColor ?? '#000000'} onChange={handleColorChange} className="h-10 w-10 rounded-md border-gray-300" />
            <Input id="accentColorText" name="accentColor" type="text" label="" value={tenant.branding.accentColor ?? ''} onChange={handleColorChange} />
          </div>
        </div>
      </div>

      {/* Social Media Links Section */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Social Media Links</h3>
        <p className="mt-1 text-sm text-gray-500">Add your social media profiles. These will appear in your temple&apos;s footer.</p>
        <p className="mt-1 text-xs text-amber-700">Drag to reorder. URLs must use HTTPS.</p>
      </div>
      <div className="space-y-4">
        {socialLinks.map((link, index) => (
          <div
            key={`${link.platform}-${index}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border transition-all ${
              draggedIndex === index ? 'opacity-50 border-amber-500' : 'border-gray-200'
            } ${socialLinkErrors[index] ? 'border-red-300 bg-red-50' : ''}`}
          >
            {/* Drag handle */}
            <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 pt-2">
              <FaGripVertical size={16} />
            </div>
            
            {/* Platform icon */}
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-gray-200 text-gray-600">
              {getPlatformIcon(link.platform)}
            </div>
            
            {/* Form fields */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Platform</label>
                <span className="text-sm font-medium text-gray-900">{getPlatformName(link.platform)}</span>
              </div>
              <div className="md:col-span-2">
                <Input
                  label="URL"
                  id={`socialUrl-${index}`}
                  name="url"
                  type="url"
                  value={link.url ?? ''}
                  onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className={socialLinkErrors[index] ? 'border-red-500' : ''}
                />
                {socialLinkErrors[index] && (
                  <p className="mt-1 text-xs text-red-600">{socialLinkErrors[index]}</p>
                )}
              </div>
              <Input
                label="Label (optional)"
                id={`socialLabel-${index}`}
                name="label"
                value={link.label ?? ''}
                onChange={(e) => handleSocialLinkChange(index, 'label', e.target.value)}
                placeholder={getPlatformName(link.platform)}
              />
              <div className="flex items-end pb-2">
                <ToggleSwitch
                  label="Show in footer"
                  enabled={link.showInFooter ?? true}
                  onChange={(enabled) => handleSocialLinkChange(index, 'showInFooter', enabled)}
                />
              </div>
            </div>
            
            {/* Delete button */}
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => handleRemoveSocialLink(index)}
              aria-label="Remove social link"
              className="!p-2 flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
        ))}
        
        {/* Add Platform Button with Picker */}
        <div className="relative">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowPlatformPicker(!showPlatformPicker)}
            disabled={availablePlatforms.length === 0}
          >
            + Add Social Link
          </Button>
          
          {showPlatformPicker && availablePlatforms.length > 0 && (
            <div className="absolute z-10 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
              <p className="text-xs text-gray-500 px-2 pb-2">Select a platform:</p>
              <div className="grid grid-cols-2 gap-1">
                {availablePlatforms.map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handleAddSocialLink(platform.id)}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-sm text-gray-700 transition-colors"
                  >
                    <span className="text-gray-500">{platform.icon}</span>
                    {platform.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {availablePlatforms.length === 0 && socialLinks.length > 0 && (
          <p className="text-sm text-gray-500">All available platforms have been added.</p>
        )}
      </div>

      {/* Footer Preview */}
      {socialLinks.some((link) => link.url && link.showInFooter) && (
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Footer Preview</h3>
          <p className="mt-1 text-sm text-gray-500 mb-4">Preview how your social links will appear in the footer.</p>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">Follow us:</span>
                  <div className="flex gap-3">
                    {socialLinks
                      .filter((link) => link.url && link.showInFooter)
                      .map((link, i) => (
                        <span
                          key={`preview-${link.platform}-${i}`}
                          className="text-gray-600 hover:text-amber-600 transition-colors cursor-pointer"
                          title={link.label || getPlatformName(link.platform)}
                        >
                          {getPlatformIcon(link.platform)}
                        </span>
                      ))}
                  </div>
                </div>
                <p className="text-center text-sm text-gray-500">
                  &copy; {new Date().getFullYear()} {previewTenant.name}. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Custom Links</h3>
        <p className="mt-1 text-sm text-gray-500">Add custom links to your temple&apos;s public page (e.g., website, donations).</p>
        <p className="mt-1 text-xs text-amber-700">To enable the &apos;Donate&apos; button on your home page, add a link with the exact label &quot;Donate&quot;.</p>
      </div>
      <div className="space-y-4">
        {(tenant.branding.customLinks || []).map((link, index) => (
          <div key={index} className="flex items-end space-x-4">
            <div className="grid grid-cols-2 gap-4 flex-grow">
              <Input
                label="Label"
                id={`linkLabel-${index}`}
                name="label"
                value={link.label ?? ''}
                onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
                placeholder="e.g., Our Website"
              />
              <Input
                label="URL"
                id={`linkUrl-${index}`}
                name="url"
                type="url"
                value={link.url ?? ''}
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
          disabled={isSaving || hasValidationErrors}
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
        {hasValidationErrors && (
          <p className="mt-2 text-sm text-red-600">Please fix validation errors before saving.</p>
        )}
      </div>
    </div>
  );
};

export default BrandingTab;
