/**
 * Secrets Loader
 * 
 * This module loads encrypted secrets into process.env on startup.
 * Import this file early in your application (e.g., in instrumentation.ts or next.config.js).
 * 
 * The SECRETS_MASTER_PASSWORD environment variable must be set for this to work.
 * In development, you can unlock secrets through the admin UI.
 */

import { loadSecretsToEnv } from './secrets';

// Only load in Node.js environment (not in browser)
if (typeof window === 'undefined') {
  try {
    if (process.env.SECRETS_MASTER_PASSWORD) {
      loadSecretsToEnv();
      console.log('[Secrets] Loaded encrypted secrets into environment');
    } else {
      console.log('[Secrets] No SECRETS_MASTER_PASSWORD set, skipping encrypted secrets');
    }
  } catch (error) {
    console.error('[Secrets] Failed to load encrypted secrets:', error);
  }
}

export {};
