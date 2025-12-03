import { SUPPORTED_LANGUAGES, SupportedLanguageCode, TranslationSettings } from '@/types';
import crypto from 'crypto';

// Cache for translations with TTL
interface CacheEntry {
  translation: string;
  timestamp: number;
  hash: string;
}

const translationCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiter
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Generate a hash for cache key
 */
function generateCacheKey(text: string, targetLang: string, tenantId: string): string {
  const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
  return `${tenantId}:${targetLang}:${hash}`;
}

/**
 * Check if language is RTL
 */
export function isRTL(langCode: string): boolean {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
  return lang?.rtl ?? false;
}

/**
 * Get language info
 */
export function getLanguageInfo(langCode: string) {
  return SUPPORTED_LANGUAGES.find(l => l.code === langCode);
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

/**
 * Filter allowed languages based on tenant settings
 */
export function getAllowedLanguages(settings?: TranslationSettings) {
  if (!settings?.allowedLanguages?.length) {
    return SUPPORTED_LANGUAGES;
  }
  return SUPPORTED_LANGUAGES.filter(l => settings.allowedLanguages.includes(l.code));
}

/**
 * Check rate limit for translation requests
 */
function checkRateLimit(tenantId: string, limit: number = 60): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  const entry = rateLimitMap.get(tenantId);
  
  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitMap.set(tenantId, { count: 1, windowStart: now });
    return true;
  }
  
  if (entry.count >= limit) {
    return false;
  }
  
  entry.count++;
  return true;
}

/**
 * Apply glossary replacements
 */
function applyGlossary(
  text: string, 
  targetLang: string, 
  glossary?: Record<string, Record<string, string>>
): string {
  if (!glossary) return text;
  
  let result = text;
  for (const [term, translations] of Object.entries(glossary)) {
    if (translations[targetLang]) {
      // Case-insensitive replacement while preserving original case
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      result = result.replace(regex, translations[targetLang]);
    }
  }
  return result;
}

/**
 * Translate text using a mock/placeholder translation service
 * In production, this would integrate with Google Translate, DeepL, etc.
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
  tenantId: string,
  settings?: TranslationSettings
): Promise<{ translation: string; cached: boolean; error?: string }> {
  // Same language - return original
  if (sourceLang === targetLang) {
    return { translation: text, cached: false };
  }
  
  // Check if target language is allowed
  if (settings?.allowedLanguages?.length && !settings.allowedLanguages.includes(targetLang)) {
    return { 
      translation: text, 
      cached: false, 
      error: `Language ${targetLang} is not enabled for this tenant` 
    };
  }
  
  // Check rate limit
  const rateLimit = settings?.rateLimitPerMinute ?? 60;
  if (!checkRateLimit(tenantId, rateLimit)) {
    return { 
      translation: text, 
      cached: false, 
      error: 'Rate limit exceeded. Please try again later.' 
    };
  }
  
  // Check cache
  const cacheKey = generateCacheKey(text, targetLang, tenantId);
  const cached = translationCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { translation: cached.translation, cached: true };
  }
  
  // Apply glossary first
  let translatedText = applyGlossary(text, targetLang, settings?.glossary);
  
  // Mock translation - in production, call actual translation API
  // For demo purposes, we'll add a prefix to show it was "translated"
  translatedText = await mockTranslate(translatedText, sourceLang, targetLang);
  
  // Cache the result
  translationCache.set(cacheKey, {
    translation: translatedText,
    timestamp: Date.now(),
    hash: cacheKey
  });
  
  return { translation: translatedText, cached: false };
}

/**
 * Mock translation function - replace with actual API in production
 */
async function mockTranslate(
  text: string, 
  _sourceLang: string, 
  targetLang: string
): Promise<string> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Simple mock translations for demo
  const langInfo = getLanguageInfo(targetLang);
  if (!langInfo) return text;
  
  // For demo, we'll just return the original text
  // In production, this would call Google Translate, DeepL, etc.
  return text;
}

/**
 * Batch translate multiple texts
 */
export async function translateBatch(
  texts: string[],
  sourceLang: string,
  targetLang: string,
  tenantId: string,
  settings?: TranslationSettings
): Promise<{ translations: string[]; errors: string[] }> {
  const translations: string[] = [];
  const errors: string[] = [];
  
  for (const text of texts) {
    const result = await translateText(text, sourceLang, targetLang, tenantId, settings);
    translations.push(result.translation);
    if (result.error) {
      errors.push(result.error);
    }
  }
  
  return { translations, errors };
}

/**
 * Clear translation cache for a tenant
 */
export function clearTranslationCache(tenantId: string): number {
  let cleared = 0;
  const keysToDelete: string[] = [];
  translationCache.forEach((_, key) => {
    if (key.startsWith(`${tenantId}:`)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => {
    translationCache.delete(key);
    cleared++;
  });
  return cleared;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; tenants: string[] } {
  const tenants = new Set<string>();
  translationCache.forEach((_, key) => {
    const tenantId = key.split(':')[0];
    tenants.add(tenantId);
  });
  return {
    size: translationCache.size,
    tenants: Array.from(tenants)
  };
}

/**
 * Format date for locale
 */
export function formatDateForLocale(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

/**
 * Format number for locale
 */
export function formatNumberForLocale(num: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale).format(num);
  } catch {
    return num.toString();
  }
}

/**
 * Format currency for locale
 */
export function formatCurrencyForLocale(
  amount: number, 
  currency: string, 
  locale: string
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
