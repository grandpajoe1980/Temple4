"use client";

import React, { useEffect, useState } from 'react';

type ProviderConfig = {
  id?: string;
  provider?: string;
  settings?: any;
};

export default function EmailConfigPage() {
  const [config, setConfig] = useState<ProviderConfig | null>(null);
  const [provider, setProvider] = useState('gmail');
  const [authMode, setAuthMode] = useState('oauth2');
  const [form, setForm] = useState<any>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/email-config', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data) => {
        // Normalize responses that may be wrapped as { data: payload } or the raw payload itself
        const payload = data?.ok !== undefined ? data.data : (data?.data ? data.data : data);
        const envOverride = data?.envOverride === true;
        if (!payload) return;
        // include server-reported envOverride flag on the config object so UI can display it
        const augmented = { ...(payload || {}), envOverride } as any;
        setConfig(augmented);
        if (payload.provider) setProvider(payload.provider);
        if (payload.settings) {
          setForm(payload.settings);
          if (payload.settings.authMode) setAuthMode(payload.settings.authMode);
        }
      })
      .catch(() => {});
  }, []);

  function updateField(path: string, value: any) {
    setForm((prev: any) => ({ ...prev, [path]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const body = { provider, settings: { ...form, authMode } };
    const res = await fetch('/api/admin/email-config', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' });
    const data = await res.json();
    const ok = data?.ok !== undefined ? data.ok : res.ok;
    if (ok) {
      // refresh the latest saved config so the UI reflects persisted values
      try {
        const r = await fetch('/api/admin/email-config', { credentials: 'same-origin' });
        const latest = await r.json();
        const payload = latest?.ok !== undefined ? latest.data : (latest?.data ? latest.data : latest);
        const envOverrideLatest = latest?.envOverride === true;
        if (payload) {
          const augmentedLatest = { ...(payload || {}), envOverride: envOverrideLatest } as any;
          setConfig(augmentedLatest);
          if (payload.provider) setProvider(payload.provider);
          if (payload.settings) {
            setForm(payload.settings);
            if (payload.settings.authMode) setAuthMode(payload.settings.authMode);
          }
        }
      } catch (err) {
        // ignore refresh errors but still show saved
      }

      setMessage('Saved');
    } else {
      // try to surface an error message from the server
      const errMsg = data?.error || data?.message || 'Failed to save';
      setMessage(errMsg);
    }
  }

  async function handleTestEmail() {
    setMessage(null);
    try {
      // prompt for an email address
      const to = window.prompt('Send test email to (address):');
      if (!to) return;
      const clean = to.trim();
      // simple email validation
      const re = /^\S+@\S+\.\S+$/;
      if (!re.test(clean)) {
        setMessage('Invalid email address');
        return;
      }

      const res = await fetch('/api/admin/email-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: clean }),
        credentials: 'same-origin',
      });

      const data = await res.json();
      if (res.ok && (data?.ok || data?.success)) {
        setMessage('Test email sent');
      } else {
        setMessage(data?.error || data?.message || 'Failed to send test email');
      }
    } catch (err) {
      setMessage('Failed to send test email');
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Email Provider Configuration</h1>
      <div style={{ marginBottom: 12, padding: 8, backgroundColor: '#f3f4f6', borderLeft: '4px solid #f59e0b' }}>
        <strong>Quick note:</strong> You can also set SMTP via environment variables for local testing. If `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are present, they will be used instead of the saved DB provider settings.
      </div>
      {/** Show a clear badge when env SMTP is active */}
      {typeof (window as any) !== 'undefined' && (function renderEnvBadge() {
        // We capture envOverride from the fetched response via a small closure.
        // If server returned envOverride, it has already been applied to `config` object above
        // but we also attempt to read it from the fetched data stored in `config`.
        // Show a simple indicator if the server says envOverride is active.
        const envActive = (config as any)?.envOverride === true || (window as any).__ENV_SMTP_ACTIVE === true;
        return envActive ? (
          <div style={{ marginBottom: 12, padding: 8, backgroundColor: '#ecfdf5', borderLeft: '4px solid #10b981' }}>
            <strong>ENV SMTP is active:</strong> Server will use environment SMTP credentials instead of DB settings.
          </div>
        ) : null;
      })()}
      <div style={{ marginBottom: 12 }}>
        <button type="button" onClick={() => { window.location.href = '/api/email/google/start'; }} className="border rounded px-4 py-2">Connect Google (authorize Gmail send)</button>
        <span style={{ marginLeft: 12, color: '#6b7280' }}>Authorize Temple to send email using a Google account (saves a refresh token).</span>
      </div>
      <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 12 }}>
          <label>Provider</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="gmail">Gmail</option>
            <option value="sendgrid">SendGrid</option>
            <option value="resend">Resend</option>
            <option value="mock">Mock</option>
          </select>
        </div>

        {provider === 'gmail' && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label>Auth Mode</label>
              <select value={authMode} onChange={(e) => setAuthMode(e.target.value)}>
                <option value="oauth2">OAuth2 (recommended)</option>
                <option value="smtp">SMTP (user/pass)</option>
              </select>
            </div>

            {authMode === 'oauth2' ? (
              <>
                <div>
                  <label>Gmail user (email)</label>
                  <input value={form.user || ''} onChange={(e) => updateField('user', e.target.value)} />
                </div>
                <div>
                  <label>Client ID</label>
                  <input value={form.clientId || ''} onChange={(e) => updateField('clientId', e.target.value)} />
                </div>
                <div>
                  <label>Client Secret</label>
                  <input value={form.clientSecret || ''} onChange={(e) => updateField('clientSecret', e.target.value)} />
                </div>
                <div>
                  <label>Refresh Token</label>
                  <input value={form.refreshToken || ''} onChange={(e) => updateField('refreshToken', e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label>SMTP user (email)</label>
                  <input value={form.user || ''} onChange={(e) => updateField('user', e.target.value)} />
                </div>
                <div>
                  <label>SMTP password / app password</label>
                  <input value={form.pass || ''} onChange={(e) => updateField('pass', e.target.value)} />
                </div>
              </>
            )}

            <div>
              <label>From Email</label>
              <input value={form.fromEmail || ''} onChange={(e) => updateField('fromEmail', e.target.value)} />
            </div>
            <div>
              <label>From Name</label>
              <input value={form.fromName || ''} onChange={(e) => updateField('fromName', e.target.value)} />
            </div>
          </>
        )}

        {provider !== 'gmail' && (
          <div style={{ marginTop: 12 }}>
            <label>Provider settings JSON</label>
            <textarea value={JSON.stringify(form || {}, null, 2)} onChange={(e) => { try { setForm(JSON.parse(e.target.value)); } catch {}}} rows={6} style={{ width: '100%' }} />
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <button type="submit" className="bg-amber-400 text-white rounded-full px-6 py-2">Save</button>
          <button type="button" onClick={handleTestEmail} className="ml-3 border rounded px-4 py-2">Test Email</button>
        </div>
        {message && <div style={{ marginTop: 12 }}>{message}</div>}
      </form>
    </div>
  );
}
