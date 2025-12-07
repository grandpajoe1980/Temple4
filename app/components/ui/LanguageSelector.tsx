"use client";

import React, { useState, useRef, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '@/types';
import useTranslation from '@/app/hooks/useTranslation';

interface LanguageSelectorProps {
  allowedLanguages?: string[];
  className?: string;
  variant?: 'dropdown' | 'inline' | 'compact';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  allowedLanguages,
  className = '',
  variant = 'dropdown',
}) => {
  const { lang, setLang, t, languageInfo, isLoading } = useTranslation({ allowedLanguages });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableLanguages = allowedLanguages?.length
    ? SUPPORTED_LANGUAGES.filter(l => allowedLanguages.includes(l.code))
    : SUPPORTED_LANGUAGES;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'compact') {
    return (
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className={`px-2 py-1 text-sm border border-gray-300 rounded-md bg-white focus:ring-[rgb(var(--primary-rgb))] focus:tenant-border-200 ${className}`}
        aria-label={t('accessibility.languageSelector')}
        disabled={isLoading}
      >
        {availableLanguages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.code.toUpperCase()}
          </option>
        ))}
      </select>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {availableLanguages.map((language) => (
          <button
            key={language.code}
            onClick={() => setLang(language.code)}
            disabled={isLoading}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              lang === language.code
                ? 'tenant-bg-100 tenant-text-primary font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {language.nativeName}
          </button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-rgb))] focus:tenant-border-200"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('accessibility.languageSelector')}
      >
        <span className="text-lg" role="img" aria-hidden="true">🌐</span>
        <span>{languageInfo?.nativeName || lang.toUpperCase()}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {isLoading && (
          <span className="w-4 h-4 border-2 tenant-border-200 border-t-transparent rounded-full animate-spin" />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto"
          role="listbox"
          aria-label={t('settings.selectLanguage')}
        >
          <ul className="py-1">
            {availableLanguages.map((language) => (
              <li key={language.code}>
                <button
                  type="button"
                  onClick={() => {
                    setLang(language.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                    lang === language.code ? 'tenant-bg-50 tenant-text-primary' : 'text-gray-700'
                  }`}
                  role="option"
                  aria-selected={lang === language.code}
                >
                  <span className="flex-1">
                    <span className="font-medium">{language.nativeName}</span>
                    {language.name !== language.nativeName && (
                      <span className="ml-2 text-gray-500">({language.name})</span>
                    )}
                  </span>
                  {language.rtl && (
                    <span className="text-xs text-gray-400">RTL</span>
                  )}
                    {lang === language.code && (
                    <svg className="w-4 h-4 tenant-text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
