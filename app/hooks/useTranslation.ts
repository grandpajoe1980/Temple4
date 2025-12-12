"use client";

import { useCallback, useEffect, useState } from 'react';
import { getTranslation, detectBrowserLanguage, isSupportedLanguage } from '@/lib/i18n';
import { isRTL, getLanguageInfo } from '@/lib/services/translation';

const STORAGE_KEY = 'preferred-language';
const DEFAULT_LANG = 'en';

interface UseTranslationOptions {
  defaultLang?: string;
  allowedLanguages?: string[];
}

export function useTranslation(options: UseTranslationOptions = {}) {
  // Always start with default language to prevent hydration mismatch
  // The server and client must render the same content initially
  const [lang, setLangState] = useState<string>(options.defaultLang || DEFAULT_LANG);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load stored language preference AFTER initial hydration
  useEffect(() => {
    setIsMounted(true);

    // Check localStorage for stored preference
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isSupportedLanguage(stored)) {
      setLangState(stored);
    } else {
      // Fall back to browser language detection
      const browserLang = detectBrowserLanguage();
      if (browserLang !== lang) {
        setLangState(browserLang);
      }
    }
  }, []); // Only run once on mount

  // Sync with localStorage and update document attributes when language changes
  useEffect(() => {
    if (!isMounted) return;

    localStorage.setItem(STORAGE_KEY, lang);
    // Update HTML dir attribute for RTL support
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isMounted]);

  const setLang = useCallback((newLang: string) => {
    if (options.allowedLanguages?.length && !options.allowedLanguages.includes(newLang)) {
      console.warn(`Language ${newLang} is not in allowed languages`);
      return;
    }
    if (isSupportedLanguage(newLang)) {
      setIsLoading(true);
      setLangState(newLang);
      // Brief loading state for UX
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
    isMounted,
    isRTL: isRTL(lang),
    languageInfo,
  };
}

export default useTranslation;

