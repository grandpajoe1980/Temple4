import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const origin = process.env.NEXTAUTH_URL || `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('host')}`;
  const redirectUri = `${origin.replace(/\/$/, '')}/api/email/google/callback`;

  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'GMAIL_OAUTH_CLIENT_ID not configured' }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email openid',
    access_type: 'offline',
    prompt: 'consent',
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(url);
}
