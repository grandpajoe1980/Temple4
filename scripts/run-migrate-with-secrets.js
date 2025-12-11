#!/usr/bin/env node
// Loads DIRECT_DATABASE_URL from encrypted secrets and runs prisma migrate
const path = require('path');
const cp = require('child_process');

// Resolve the project root
const projectRoot = path.resolve(__dirname, '..');

// We'll decrypt the secrets file directly to avoid importing TS modules.
const fs = require('fs');
const crypto = require('crypto');

const SECRETS_FILE = path.join(projectRoot, 'secrets.encrypted.json');
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // bytes
const PBKDF2_ITERATIONS = 100000;

function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
}

function decryptValue(encrypted, masterPassword) {
  const salt = Buffer.from(encrypted.salt, 'base64');
  const iv = Buffer.from(encrypted.iv, 'base64');
  const tag = Buffer.from(encrypted.tag, 'base64');
  const key = deriveKey(masterPassword, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted.data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const masterPassword = process.env.SECRETS_MASTER_PASSWORD;
if (!masterPassword) {
  console.error('[run-migrate-with-secrets] SECRETS_MASTER_PASSWORD is not set in the environment');
  process.exit(1);
}

if (!fs.existsSync(SECRETS_FILE)) {
  console.error('[run-migrate-with-secrets] secrets.encrypted.json not found at', SECRETS_FILE);
  process.exit(1);
}

const secretsFile = JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8'));
// Prefer DIRECT_DATABASE_URL; fall back to DATABASE_URL if direct not present
let enc = secretsFile.secrets && secretsFile.secrets['DIRECT_DATABASE_URL'];
if (!enc) {
  enc = secretsFile.secrets && secretsFile.secrets['DATABASE_URL'];
  if (enc) {
    console.warn('[run-migrate-with-secrets] DIRECT_DATABASE_URL not present; falling back to DATABASE_URL from secrets');
  }
}

if (!enc) {
  console.error('[run-migrate-with-secrets] Neither DIRECT_DATABASE_URL nor DATABASE_URL present in secrets.encrypted.json');
  process.exit(1);
}

let directDb;
try {
  directDb = decryptValue(enc, masterPassword);
} catch (e) {
  console.error('[run-migrate-with-secrets] Failed to decrypt database URL:', e.message || e);
  process.exit(1);
}

// Prepare environment for child process
const env = Object.assign({}, process.env, {
  DIRECT_DATABASE_URL: directDb,
  DATABASE_URL: directDb,
});

console.log('[run-migrate-with-secrets] Running prisma migrate with DIRECT_DATABASE_URL loaded from secrets');

const res = cp.spawnSync('npx', ['prisma', 'migrate', 'dev', '--name', 'add_friends_feature'], {
  stdio: 'inherit',
  env,
  cwd: projectRoot,
  shell: true,
});

process.exit(res.status || 0);
