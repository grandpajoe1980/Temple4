/**
 * Next.js Instrumentation
 * 
 * This file runs before any other code in the application.
 * We use it to load encrypted secrets into process.env BEFORE
 * Prisma or any other module tries to read DATABASE_URL.
 * 
 * The SECRETS_MASTER_PASSWORD environment variable must be set.
 */

export async function register() {
  // Only run on the server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamically import to avoid issues with edge runtime
    const { loadSecretsToEnv } = await import('./lib/secrets');
    
    if (process.env.SECRETS_MASTER_PASSWORD) {
      try {
        loadSecretsToEnv();
        console.log('[Instrumentation] Loaded encrypted secrets into environment');
        
        // Log which critical secrets are available (not their values!)
        const criticalSecrets = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
        for (const key of criticalSecrets) {
          console.log(`[Instrumentation] ${key}: ${process.env[key] ? '✓ set' : '✗ missing'}`);
        }
      } catch (error) {
        console.error('[Instrumentation] Failed to load encrypted secrets:', error);
      }
    } else {
      console.warn('[Instrumentation] SECRETS_MASTER_PASSWORD not set - using .env values only');
    }
  }
}
