import TEST_CONFIG from './test-config';

function getSetCookieValues(headers: Headers): string[] {
  const headerWithRaw = headers as Headers & { raw?: () => Record<string, string[]>; getSetCookie?: () => string[] };

  if (typeof headerWithRaw.getSetCookie === 'function') {
    return headerWithRaw.getSetCookie();
  }

  const raw = headerWithRaw.raw?.();
  if (raw?.['set-cookie']) {
    return raw['set-cookie'];
  }

  const single = headers.get('set-cookie');
  return single ? [single] : [];
}

export function normalizeSetCookieHeader(setCookie: string | string[] | null): string | null {
  const values = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];

  const cookies = values
    .flatMap((value) => value.split(/,(?=[^ ;]+=)/))
    .map((part) => part.split(';')[0]?.trim())
    .filter((part): part is string => Boolean(part));

  return cookies.length > 0 ? cookies.join('; ') : null;
}

export async function performCredentialsLogin(email: string, password: string) {
  const csrfResponse = await fetch(`${TEST_CONFIG.apiBaseUrl}/auth/csrf`);
  const csrfData = await csrfResponse.json().catch(() => null);
  const csrfToken = csrfData?.csrfToken;
  const csrfCookie = normalizeSetCookieHeader(getSetCookieValues(csrfResponse.headers));

  const loginResponse = await fetch(`${TEST_CONFIG.apiBaseUrl}/auth/callback/credentials`, {
    method: 'POST',
    body: new URLSearchParams({
      email,
      password,
      csrfToken: csrfToken ?? '',
      callbackUrl: `${TEST_CONFIG.baseUrl}/`,
      json: 'true',
    }),
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(csrfCookie ? { Cookie: csrfCookie } : {}),
    },
  });

  return {
    loginResponse,
    cookieHeader: normalizeSetCookieHeader(getSetCookieValues(loginResponse.headers)),
  };
}
