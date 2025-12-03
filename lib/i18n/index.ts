import en from './locales/en.json';
import es from './locales/es.json';
import { SupportedLanguageCode, SUPPORTED_LANGUAGES } from '@/types';

// Type for translation keys with nested paths
type NestedKeyOf<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends Record<string, unknown>
    ? `${K}.${NestedKeyOf<T[K]>}`
    : K
  : never;

export type TranslationKey = NestedKeyOf<typeof en>;

// All locale files
const locales: Record<string, typeof en> = {
  en,
  es,
};

/**
 * Get a translation by key path (e.g., "common.loading")
 */
export function getTranslation(
  key: string,
  lang: string = 'en',
  params?: Record<string, string | number>
): string {
  const locale = locales[lang] || locales.en;
  const keys = key.split('.');
  
  let result: unknown = locale;
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      // Fallback to English
      result = locale;
      for (const ek of keys) {
        if (result && typeof result === 'object' && ek in result) {
          result = (result as Record<string, unknown>)[ek];
        } else {
          return key; // Return key if not found
        }
      }
      break;
    }
  }
  
  if (typeof result !== 'string') {
    return key;
  }
  
  // Replace {{param}} placeholders
  if (params) {
    return result.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
      return params[paramKey]?.toString() || `{{${paramKey}}}`;
    });
  }
  
  return result;
}

/**
 * Create a t function bound to a specific language
 */
export function createTranslator(lang: string = 'en') {
  return (key: string, params?: Record<string, string | number>) => 
    getTranslation(key, lang, params);
}

/**
 * Get all translations for a namespace
 */
export function getNamespace(namespace: string, lang: string = 'en'): Record<string, unknown> {
  const locale = locales[lang] || locales.en;
  const parts = namespace.split('.');
  
  let result: unknown = locale;
  for (const part of parts) {
    if (result && typeof result === 'object' && part in result) {
      result = (result as Record<string, unknown>)[part];
    } else {
      return {};
    }
  }
  
  return typeof result === 'object' ? result as Record<string, unknown> : {};
}

/**
 * Check if a language is supported
 */
export function isSupportedLanguage(lang: string): lang is SupportedLanguageCode {
  return SUPPORTED_LANGUAGES.some(l => l.code === lang);
}

/**
 * Get browser language or fallback to default
 */
export function detectBrowserLanguage(): string {
  if (typeof navigator === 'undefined') return 'en';
  
  const browserLangs = navigator.languages || [navigator.language];
  for (const lang of browserLangs) {
    const code = lang.split('-')[0]; // Get base language code
    if (isSupportedLanguage(code)) {
      return code;
    }
  }
  
  return 'en';
}

/**
 * Load locale dynamically (for code splitting in future)
 */
export async function loadLocale(lang: string): Promise<typeof en> {
  if (locales[lang]) {
    return locales[lang];
  }
  
  // For now, return English as fallback
  // In production, this could dynamically import locale files
  return locales.en;
}

export { SUPPORTED_LANGUAGES };
export { en, es };
