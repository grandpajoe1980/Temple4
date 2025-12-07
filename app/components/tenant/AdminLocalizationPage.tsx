"use client";

import React, { useState, useEffect } from 'react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import ToggleSwitch from '@/app/components/ui/ToggleSwitch';
import { SUPPORTED_LANGUAGES, TranslationSettings } from '@/types';

interface AdminLocalizationPageProps {
  tenant: {
    id: string;
    name: string;
    settings: {
      enableTranslation?: boolean;
      translationSettings?: TranslationSettings;
    };
  };
}

const defaultSettings: TranslationSettings = {
  allowedLanguages: ['en'],
  defaultLanguage: 'en',
  autoTranslateUserContent: false,
  glossary: {},
  rateLimitPerMinute: 60,
  costLimitPerMonth: 100,
  excludedFields: [],
};

const AdminLocalizationPage: React.FC<AdminLocalizationPageProps> = ({ tenant }) => {
  const [enabled, setEnabled] = useState(tenant.settings?.enableTranslation ?? false);
  const [settings, setSettings] = useState<TranslationSettings>({
    ...defaultSettings,
    ...(tenant.settings?.translationSettings || {}),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Glossary state
  const [newTerm, setNewTerm] = useState('');
  const [newTermTranslations, setNewTermTranslations] = useState<Record<string, string>>({});
  
  // Excluded fields state
  const [newExcludedField, setNewExcludedField] = useState('');

  const toggleLanguage = (langCode: string) => {
    const current = settings.allowedLanguages || [];
    if (current.includes(langCode)) {
      // Don't allow removing the last language or default language
      if (current.length === 1 || langCode === settings.defaultLanguage) return;
      setSettings({
        ...settings,
        allowedLanguages: current.filter(l => l !== langCode),
      });
    } else {
      setSettings({
        ...settings,
        allowedLanguages: [...current, langCode],
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enableTranslation: enabled,
          translationSettings: settings,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save settings');
      }
      
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setSaveMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save settings' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addGlossaryTerm = () => {
    if (!newTerm.trim()) return;
    
    const updatedGlossary = {
      ...settings.glossary,
      [newTerm.toLowerCase()]: newTermTranslations,
    };
    
    setSettings({ ...settings, glossary: updatedGlossary });
    setNewTerm('');
    setNewTermTranslations({});
  };

  const removeGlossaryTerm = (term: string) => {
    const { [term]: _, ...rest } = settings.glossary || {};
    setSettings({ ...settings, glossary: rest });
  };

  const addExcludedField = () => {
    if (!newExcludedField.trim()) return;
    
    const current = settings.excludedFields || [];
    if (!current.includes(newExcludedField)) {
      setSettings({
        ...settings,
        excludedFields: [...current, newExcludedField],
      });
    }
    setNewExcludedField('');
  };

  const removeExcludedField = (field: string) => {
    setSettings({
      ...settings,
      excludedFields: (settings.excludedFields || []).filter(f => f !== field),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Localization Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure translation and localization options for {tenant.name}.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-md ${
          saveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* Master Toggle */}
      <Card title="Translation Feature" description="Enable or disable translation capabilities for your community.">
        <ToggleSwitch
          label="Enable Translation"
          enabled={enabled}
          onChange={setEnabled}
        />
        {!enabled && (
          <p className="mt-2 text-sm text-gray-500">
            When disabled, all translation features will be hidden from users.
          </p>
        )}
      </Card>

      {enabled && (
        <>
          {/* Allowed Languages */}
          <Card title="Allowed Languages" description="Select which languages members can translate content to.">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {SUPPORTED_LANGUAGES.map((language) => {
                const isSelected = (settings.allowedLanguages || []).includes(language.code);
                const isDefault = language.code === settings.defaultLanguage;
                
                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => toggleLanguage(language.code)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition ${
                      isSelected
                        ? 'tenant-border-200 tenant-bg-50 tenant-text-primary'
                        : 'border-gray-200 bg-white text-gray-600 hover:tenant-border-200'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isSelected ? 'tenant-active tenant-border-200' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 text-sm">
                      <span className="font-medium">{language.nativeName}</span>
                      {isDefault && (
                        <span className="ml-1 text-xs tenant-text-primary">(default)</span>
                      )}
                      {language.rtl && (
                        <span className="ml-1 text-xs text-gray-400">RTL</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Default Language */}
          <Card title="Default Language" description="The primary language for your community. New content will be in this language.">
            <select
              value={settings.defaultLanguage}
              onChange={(e) => {
                const newDefault = e.target.value;
                // Ensure default is in allowed languages
                const allowed = settings.allowedLanguages || [];
                setSettings({
                  ...settings,
                  defaultLanguage: newDefault,
                  allowedLanguages: allowed.includes(newDefault) ? allowed : [...allowed, newDefault],
                });
              }}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-[rgb(var(--primary-rgb))] focus:tenant-border-200"
            >
              {SUPPORTED_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name} ({language.nativeName})
                </option>
              ))}
            </select>
          </Card>

          {/* Auto-translate Toggle */}
          <Card title="Automatic Translation" description="Automatically translate user-generated content.">
            <ToggleSwitch
              label="Auto-translate User Content"
              enabled={settings.autoTranslateUserContent}
              onChange={(value) => setSettings({ ...settings, autoTranslateUserContent: value })}
            />
            <p className="mt-2 text-sm text-gray-500">
              When enabled, posts, comments, and other user content will be automatically translated based on each user's language preference.
            </p>
          </Card>

          {/* Glossary */}
          <Card title="Glossary" description="Define custom translations for specific terms used in your community.">
            <div className="space-y-4">
              {/* Existing terms */}
              {Object.entries(settings.glossary || {}).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(settings.glossary || {}).map(([term, translations]) => (
                    <div key={term} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{term}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {Object.entries(translations).map(([lang, translation]) => (
                            <span key={lang} className="text-xs px-2 py-1 bg-white rounded border border-gray-200">
                              <span className="font-medium text-gray-500">{lang}:</span> {translation}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGlossaryTerm(term)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new term */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Add New Term</p>
                <div className="space-y-3">
                  <Input
                    label="Term (in default language)"
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    placeholder="e.g., Fellowship Hall"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    {(settings.allowedLanguages || []).filter(l => l !== settings.defaultLanguage).map((langCode) => {
                      const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
                      return (
                        <Input
                          key={langCode}
                          label={lang?.name || langCode}
                          value={newTermTranslations[langCode] || ''}
                          onChange={(e) => setNewTermTranslations({
                            ...newTermTranslations,
                            [langCode]: e.target.value,
                          })}
                          placeholder={`Translation in ${lang?.name || langCode}`}
                        />
                      );
                    })}
                  </div>
                  <Button variant="secondary" onClick={addGlossaryTerm} disabled={!newTerm.trim()}>
                    Add Term
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Rate & Cost Limits */}
          <Card title="Limits" description="Control translation usage to manage costs.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Rate Limit (requests per minute)"
                type="number"
                min={1}
                max={1000}
                value={settings.rateLimitPerMinute?.toString() || '60'}
                onChange={(e) => setSettings({
                  ...settings,
                  rateLimitPerMinute: parseInt(e.target.value) || 60,
                })}
              />
              <Input
                label="Cost Limit (USD per month)"
                type="number"
                min={0}
                step={10}
                value={settings.costLimitPerMonth?.toString() || '100'}
                onChange={(e) => setSettings({
                  ...settings,
                  costLimitPerMonth: parseFloat(e.target.value) || 100,
                })}
              />
            </div>
          </Card>

          {/* Excluded Fields */}
          <Card title="Excluded Fields" description="Fields that should never be translated (e.g., names, addresses).">
            <div className="space-y-3">
              {/* Existing excluded fields */}
              {(settings.excludedFields || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(settings.excludedFields || []).map((field) => (
                    <span
                      key={field}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm"
                    >
                      {field}
                      <button
                        type="button"
                        onClick={() => removeExcludedField(field)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Add new field */}
              <div className="flex gap-2">
                <Input
                  value={newExcludedField}
                  onChange={(e) => setNewExcludedField(e.target.value)}
                  placeholder="e.g., displayName, address"
                  className="flex-1"
                />
                <Button variant="secondary" onClick={addExcludedField} disabled={!newExcludedField.trim()}>
                  Add
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminLocalizationPage;
