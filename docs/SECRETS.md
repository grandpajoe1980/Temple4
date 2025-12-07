# Secrets Management

This document explains how to securely manage sensitive configuration values in the Asembli platform.

## Overview

The platform includes a built-in secrets management system that:
- Encrypts secrets using AES-256-GCM encryption
- Stores encrypted data in `secrets.encrypted.json` (safe to commit to git)
- Provides an admin UI for managing secrets at `/admin/secrets`
- Automatically loads secrets into environment variables on startup

## How It Works

1. **Master Password**: All secrets are encrypted with a single master password
2. **Key Derivation**: PBKDF2 with 100,000 iterations derives the encryption key
3. **Encryption**: AES-256-GCM provides authenticated encryption
4. **Storage**: Encrypted data stored in JSON format, safe for version control

## Setup

### 1. Initial Configuration

1. Log in as a Super Admin
2. Navigate to `/admin/secrets`
3. Enter a strong master password (minimum 12 characters recommended)
4. This creates the encrypted vault

### 2. Adding Secrets

In the admin UI, you can set values for:

| Key | Description | Category |
|-----|-------------|----------|
| `NEXTAUTH_SECRET` | NextAuth.js session encryption key | Auth |
| `GMAIL_OAUTH_CLIENT_ID` | Google OAuth Client ID | OAuth |
| `GMAIL_OAUTH_CLIENT_SECRET` | Google OAuth Client Secret | OAuth |
| `SMTP_HOST` | SMTP server hostname | Email |
| `SMTP_PORT` | SMTP server port | Email |
| `SMTP_USER` | SMTP username | Email |
| `SMTP_PASS` | SMTP password/app password | Email |
| `SMTP_FROM` | Default sender address | Email |
| `IMGBB_API_KEY` | ImgBB image hosting API key | API |
| `EMAIL_API_KEY` | Resend/SendGrid API key | API |
| `DATABASE_URL_PROD` | Production database URL | Database |

### 3. Production Deployment

**Option A: Using the encrypted file**

1. Set `SECRETS_MASTER_PASSWORD` in your production environment
2. Deploy the `secrets.encrypted.json` file with your code
3. Secrets are automatically loaded on startup

```bash
# In production environment
export SECRETS_MASTER_PASSWORD="your-master-password-here"
```

**Option B: Using exported environment variables**

1. Go to `/admin/secrets`
2. Click "Export for Production"
3. Copy the generated export commands
4. Run them in your production environment

```bash
# Example output
export NEXTAUTH_SECRET='your-secret-here'
export SMTP_HOST='smtp.gmail.com'
# ... etc
```

## Security Best Practices

### DO:
- ✅ Use a strong master password (20+ characters)
- ✅ Store the master password in a password manager
- ✅ Use different master passwords for dev/staging/production
- ✅ Rotate secrets periodically
- ✅ Commit `secrets.encrypted.json` to version control

### DON'T:
- ❌ Never commit `.env` files with real secrets
- ❌ Never share the master password in plain text
- ❌ Never log decrypted secrets
- ❌ Never expose the admin secrets page to non-admins

## Files

| File | Purpose | Git? |
|------|---------|------|
| `secrets.encrypted.json` | Encrypted secrets storage | ✅ Yes |
| `.env` | Local environment overrides | ❌ No |
| `lib/secrets.ts` | Encryption/decryption logic | ✅ Yes |
| `lib/secrets-loader.ts` | Startup loader | ✅ Yes |

## API Reference

### Programmatic Access

```typescript
import { getSecret, setSecret, loadSecretsToEnv } from '@/lib/secrets';

// Get a secret (requires master password in env or passed)
const apiKey = getSecret('IMGBB_API_KEY');

// Set a secret
setSecret('IMGBB_API_KEY', 'new-value', 'master-password');

// Load all secrets into process.env
loadSecretsToEnv();
```

### REST API

All endpoints require Super Admin authentication.

```
GET  /api/admin/secrets           - List all secrets (metadata only)
POST /api/admin/secrets           - Set/update a secret
DELETE /api/admin/secrets         - Delete a secret
PUT  /api/admin/secrets           - Special operations (verify, generate, export, etc.)
```

## Troubleshooting

### "Invalid master password"
- Ensure you're using the correct password
- Each secrets file has a specific master password
- If lost, delete `secrets.encrypted.json` and start fresh

### Secrets not loading
- Check that `SECRETS_MASTER_PASSWORD` is set
- Verify `secrets.encrypted.json` exists and is valid JSON
- Check server logs for encryption errors

### Can't access admin page
- Verify you're logged in as a Super Admin
- Check that your session is valid

## Migration from .env

To migrate existing secrets from your `.env` file:

1. Go to `/admin/secrets`
2. Unlock with your master password
3. For each secret in your `.env`:
   - Find the corresponding field in the UI
   - Paste the value and save
4. After all secrets are migrated, you can remove sensitive values from `.env`

Keep these in `.env` (non-sensitive):
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
EMAIL_PROVIDER="mock"
```

Move these to encrypted secrets:
```
NEXTAUTH_SECRET
GMAIL_OAUTH_CLIENT_ID
GMAIL_OAUTH_CLIENT_SECRET
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
IMGBB_API_KEY
EMAIL_API_KEY
```
