"use client";

import { useCallback, useEffect, useState } from 'react';
import { getTranslation, detectBrowserLanguage, isSupportedLanguage } from '@/lib/i18n';
import { isRTL, getLanguageInfo } from '@/lib/services/translation';

const STORAGE_KEY = 'preferred-language';

interface UseTranslationOptions {
  defaultLang?: string;
  allowedLanguages?: string[];
}

export function useTranslation(options: UseTranslationOptions = {}) {
  const [lang, setLangState] = useState<string>(() => {
    // Try to get from localStorage on client
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isSupportedLanguage(stored)) {
        return stored;
      }
    }
    return options.defaultLang || detectBrowserLanguage();
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
      // Update HTML dir attribute for RTL support
      document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((newLang: string) => {
    if (options.allowedLanguages?.length && !options.allowedLanguages.includes(newLang)) {
      console.warn(`Language ${newLang} is not in allowed languages`);
      return;
    }
    if (isSupportedLanguage(newLang)) {
      setIsLoading(true);
      setLangState(newLang);
      // Simulate loading for UX
      setTimeout(() => setIsLoading(false), 100);
    }
  }, [options.allowedLanguages]);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    return getTranslation(key, lang, params);
  }, [lang]);

  const languageInfo = getLanguageInfo(lang);

  return {
    lang,
    setLang,
    t,
    isLoading,
    isRTL: isRTL(lang),
    languageInfo,
  };
}

export default useTranslation;
