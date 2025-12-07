/**
 * Encrypted Secrets Management
 * 
 * This module provides secure storage for sensitive configuration values.
 * Secrets are encrypted with AES-256-GCM using a master password, and the
 * encrypted data is stored in a JSON file that is safe to commit to git.
 * 
 * The master password should be set via SECRETS_MASTER_PASSWORD environment
 * variable or entered through the admin UI (stored in session only).
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const SECRETS_FILE = path.join(process.cwd(), 'secrets.encrypted.json');
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

interface EncryptedData {
  salt: string;
  iv: string;
  tag: string;
  data: string;
  version: number;
}

interface SecretsFile {
  version: number;
  createdAt: string;
  updatedAt: string;
  secrets: Record<string, EncryptedData>;
}

interface SecretMetadata {
  key: string;
  description: string;
  category: 'email' | 'oauth' | 'api' | 'auth' | 'database' | 'other';
  required: boolean;
  hasValue: boolean;
}

// Secret definitions with metadata
export const SECRET_DEFINITIONS: Record<string, Omit<SecretMetadata, 'key' | 'hasValue'>> = {
  // NextAuth
  NEXTAUTH_SECRET: {
    description: 'Secret key for NextAuth.js session encryption',
    category: 'auth',
    required: true,
  },
  
  // Gmail OAuth
  GMAIL_OAUTH_CLIENT_ID: {
    description: 'Google OAuth Client ID for Gmail integration',
    category: 'oauth',
    required: false,
  },
  GMAIL_OAUTH_CLIENT_SECRET: {
    description: 'Google OAuth Client Secret for Gmail integration',
    category: 'oauth',
    required: false,
  },
  
  // SMTP Configuration
  SMTP_HOST: {
    description: 'SMTP server hostname (e.g., smtp.gmail.com)',
    category: 'email',
    required: false,
  },
  SMTP_PORT: {
    description: 'SMTP server port (e.g., 465 for SSL)',
    category: 'email',
    required: false,
  },
  SMTP_USER: {
    description: 'SMTP username/email address',
    category: 'email',
    required: false,
  },
  SMTP_PASS: {
    description: 'SMTP password or app-specific password',
    category: 'email',
    required: false,
  },
  SMTP_FROM: {
    description: 'Default "From" address for emails',
    category: 'email',
    required: false,
  },
  
  // External APIs
  IMGBB_API_KEY: {
    description: 'ImgBB image hosting API key',
    category: 'api',
    required: false,
  },
  EMAIL_API_KEY: {
    description: 'Resend or SendGrid API key (if using API-based email)',
    category: 'api',
    required: false,
  },
  
  // Database (for production)
  DATABASE_URL_PROD: {
    description: 'Production database connection URL',
    category: 'database',
    required: false,
  },
};

/**
 * Derives an encryption key from a password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypts a value with the master password
 */
function encryptValue(value: string, masterPassword: string): EncryptedData {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(masterPassword, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(value, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const tag = cipher.getAuthTag();
  
  return {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted,
    version: 1,
  };
}

/**
 * Decrypts a value with the master password
 */
function decryptValue(encrypted: EncryptedData, masterPassword: string): string {
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

/**
 * Reads the secrets file
 */
function readSecretsFile(): SecretsFile | null {
  try {
    if (!fs.existsSync(SECRETS_FILE)) {
      return null;
    }
    const content = fs.readFileSync(SECRETS_FILE, 'utf8');
    return JSON.parse(content) as SecretsFile;
  } catch (error) {
    console.error('Failed to read secrets file:', error);
    return null;
  }
}

/**
 * Writes the secrets file
 */
function writeSecretsFile(data: SecretsFile): void {
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Initializes a new secrets file if one doesn't exist
 */
function initSecretsFile(): SecretsFile {
  const now = new Date().toISOString();
  const data: SecretsFile = {
    version: 1,
    createdAt: now,
    updatedAt: now,
    secrets: {},
  };
  writeSecretsFile(data);
  return data;
}

/**
 * Gets the master password from environment or throws if not set
 */
function getMasterPassword(): string {
  const password = process.env.SECRETS_MASTER_PASSWORD;
  if (!password) {
    throw new Error('SECRETS_MASTER_PASSWORD environment variable is not set');
  }
  return password;
}

/**
 * Stores an encrypted secret
 */
export function setSecret(key: string, value: string, masterPassword?: string): void {
  const password = masterPassword || getMasterPassword();
  let file = readSecretsFile();
  
  if (!file) {
    file = initSecretsFile();
  }
  
  file.secrets[key] = encryptValue(value, password);
  file.updatedAt = new Date().toISOString();
  
  writeSecretsFile(file);
}

/**
 * Retrieves a decrypted secret
 */
export function getSecret(key: string, masterPassword?: string): string | null {
  const password = masterPassword || getMasterPassword();
  const file = readSecretsFile();
  
  if (!file || !file.secrets[key]) {
    return null;
  }
  
  try {
    return decryptValue(file.secrets[key], password);
  } catch (error) {
    console.error(`Failed to decrypt secret ${key}:`, error);
    return null;
  }
}

/**
 * Deletes a secret
 */
export function deleteSecret(key: string): boolean {
  const file = readSecretsFile();
  
  if (!file || !file.secrets[key]) {
    return false;
  }
  
  delete file.secrets[key];
  file.updatedAt = new Date().toISOString();
  
  writeSecretsFile(file);
  return true;
}

/**
 * Checks if a secret exists (without decrypting)
 */
export function hasSecret(key: string): boolean {
  const file = readSecretsFile();
  return file !== null && key in file.secrets;
}

/**
 * Gets metadata for all defined secrets
 */
export function getSecretMetadataList(): SecretMetadata[] {
  const file = readSecretsFile();
  
  return Object.entries(SECRET_DEFINITIONS).map(([key, def]) => ({
    key,
    ...def,
    hasValue: file !== null && key in file.secrets,
  }));
}

/**
 * Verifies a master password by attempting to decrypt a known secret
 */
export function verifyMasterPassword(masterPassword: string): boolean {
  const file = readSecretsFile();
  
  if (!file || Object.keys(file.secrets).length === 0) {
    // No secrets yet, password is valid for setting up
    return true;
  }
  
  // Try to decrypt the first secret
  const firstKey = Object.keys(file.secrets)[0];
  try {
    decryptValue(file.secrets[firstKey], masterPassword);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates a secure random secret
 */
export function generateSecureSecret(length: number = 64): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Gets all secrets as key-value pairs (decrypted)
 * Use with caution - only for loading into process.env
 */
export function getAllSecrets(masterPassword?: string): Record<string, string> {
  const password = masterPassword || getMasterPassword();
  const file = readSecretsFile();
  
  if (!file) {
    return {};
  }
  
  const secrets: Record<string, string> = {};
  
  for (const [key, encrypted] of Object.entries(file.secrets)) {
    try {
      secrets[key] = decryptValue(encrypted, password);
    } catch (error) {
      console.error(`Failed to decrypt secret ${key}:`, error);
    }
  }
  
  return secrets;
}

/**
 * Loads all encrypted secrets into process.env
 * Call this during app startup
 */
export function loadSecretsToEnv(masterPassword?: string): void {
  try {
    const secrets = getAllSecrets(masterPassword);
    
    for (const [key, value] of Object.entries(secrets)) {
      // Only set if not already in env (env takes precedence)
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    console.warn('Could not load encrypted secrets:', error);
  }
}

/**
 * Re-encrypts all secrets with a new master password
 */
export function changeMasterPassword(currentPassword: string, newPassword: string): boolean {
  const file = readSecretsFile();
  
  if (!file) {
    return true; // No secrets to re-encrypt
  }
  
  // First, decrypt all secrets with current password
  const decryptedSecrets: Record<string, string> = {};
  
  for (const [key, encrypted] of Object.entries(file.secrets)) {
    try {
      decryptedSecrets[key] = decryptValue(encrypted, currentPassword);
    } catch {
      console.error(`Failed to decrypt secret ${key} with current password`);
      return false;
    }
  }
  
  // Re-encrypt with new password
  for (const [key, value] of Object.entries(decryptedSecrets)) {
    file.secrets[key] = encryptValue(value, newPassword);
  }
  
  file.updatedAt = new Date().toISOString();
  writeSecretsFile(file);
  
  return true;
}

/**
 * Exports secrets to a format suitable for production deployment
 * Returns shell export commands
 */
export function exportSecretsForProduction(masterPassword?: string): string {
  const secrets = getAllSecrets(masterPassword);
  
  const lines = Object.entries(secrets).map(([key, value]) => {
    // Escape single quotes in the value
    const escaped = value.replace(/'/g, "'\\''");
    return `export ${key}='${escaped}'`;
  });
  
  return lines.join('\n');
}
