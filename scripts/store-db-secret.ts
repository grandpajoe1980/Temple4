/**
 * Script to store DATABASE_URL in encrypted secrets
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/store-db-secret.ts
 */

import { setSecret, getSecret, hasSecret } from '../lib/secrets';

// Set master password from environment
const masterPassword = process.env.SECRETS_MASTER_PASSWORD;

if (!masterPassword) {
  console.error('ERROR: SECRETS_MASTER_PASSWORD not set in environment');
  console.log('Set it with: $env:SECRETS_MASTER_PASSWORD = "your-password"');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('ERROR: DATABASE_URL not set in environment');
  process.exit(1);
}

console.log('Storing DATABASE_URL in encrypted secrets...');
console.log('URL (masked):', dbUrl.replace(/:[^:@]+@/, ':****@'));

try {
  setSecret('DATABASE_URL', dbUrl);
  
  // Verify
  const retrieved = getSecret('DATABASE_URL');
  const matches = retrieved === dbUrl;
  
  console.log('✅ Stored successfully:', matches);
  console.log('✅ hasSecret(DATABASE_URL):', hasSecret('DATABASE_URL'));
  
  if (matches) {
    console.log('\n📋 Next steps:');
    console.log('1. Remove DATABASE_URL from .env file');
    console.log('2. Keep SECRETS_MASTER_PASSWORD in .env (this is required)');
    console.log('3. Restart the application');
    console.log('\nThe DATABASE_URL will now be loaded from secrets.encrypted.json at startup.');
  }
} catch (error) {
  console.error('Failed to store secret:', error);
  process.exit(1);
}
