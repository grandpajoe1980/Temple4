import { withErrorHandling } from '@/lib/api-response';
import { NextResponse } from 'next/server';
import { requireSuperAdminForApi } from '@/lib/middleware/requireRole';
import { setSecret, loadSecretsToEnv } from '@/lib/secrets';

/**
 * POST /api/admin/email-config/store-secrets
 * Body: { secrets: Record<string,string> }
 * Stores provided keys into encrypted secrets vault using server's SECRETS_MASTER_PASSWORD
 */
export const POST = withErrorHandling(async (req) => {
  const authCheck = await requireSuperAdminForApi(req as any);
  if (authCheck) return authCheck;

  const body = await req.json();
  const secrets = body?.secrets as Record<string, string> | undefined;
  if (!secrets || typeof secrets !== 'object') {
    return NextResponse.json({ error: 'secrets object required' }, { status: 400 });
  }

  // Attempt to write each secret using the server master password (if available)
  try {
    const master = process.env.SECRETS_MASTER_PASSWORD;
    if (!master) {
      return NextResponse.json({ error: 'Server is not configured to write secrets (missing SECRETS_MASTER_PASSWORD)' }, { status: 500 });
    }

    for (const [key, value] of Object.entries(secrets)) {
      // Only store non-empty values
      if (value !== undefined && value !== null && String(value).length > 0) {
        setSecret(key, String(value), master);
      }
    }

    // Load secrets into process.env so the running process can use them immediately
    try {
      loadSecretsToEnv(master);
    } catch (err) {
      // non-fatal: we still return success; the secrets are persisted to file
      console.warn('Stored secrets but failed to load into env:', err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to store SMTP secrets:', err);
    return NextResponse.json({ error: 'Failed to store secrets' }, { status: 500 });
  }
});
