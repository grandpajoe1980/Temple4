import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
// Use the global `fetch` available in Next.js route handlers instead of importing `node-fetch`.

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const origin = process.env.NEXTAUTH_URL || `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('host')}`;
  const redirectUri = `${origin.replace(/\/$/, '')}/api/email/google/callback`;

  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'GMAIL_OAUTH_CLIENT_ID/SECRET not configured on server' }, { status: 500 });
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    } as any).toString(),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    return NextResponse.json({ error: 'Token exchange failed', details: body }, { status: 500 });
  }

  const tokenJson = await tokenRes.json();
  const { access_token, refresh_token } = tokenJson as any;

  if (!refresh_token) {
    // Google often returns refresh_token only on first consent; advise client accordingly
    // Still capture access token to get userinfo
  }

  // Get user email from userinfo endpoint
  let userEmail = undefined;
  if (access_token) {
    try {
      const ui = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (ui.ok) {
        const uj = await ui.json();
        userEmail = uj.email;
      }
    } catch (e) {
      // ignore
    }
  }

  // Persist as a new EmailProviderConfig in DB (admin/global)
  try {
    const settings: any = {
      authMode: 'oauth2',
      clientId,
      clientSecret,
      refreshToken: refresh_token,
      user: userEmail,
      fromEmail: userEmail,
    };

    await prisma.emailProviderConfig.create({ data: { provider: 'gmail', settings } });
  } catch (dbErr) {
    return NextResponse.json({ error: 'Failed to save provider config', details: String(dbErr) }, { status: 500 });
  }

  // Redirect to admin page with a success notice
  const adminUrl = `${origin.replace(/\/$/, '')}/admin/email-config?connected=1`;
  return NextResponse.redirect(adminUrl);
}
