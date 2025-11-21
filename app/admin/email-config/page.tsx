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
    fetch('/api/admin/email-config')
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok !== undefined) {
          // api-response wrapper
          setConfig(data.data);
          if (data.data?.provider) setProvider(data.data.provider);
          if (data.data?.settings) setForm(data.data.settings);
        } else {
          setConfig(data);
          if (data?.provider) setProvider(data.provider);
          if (data?.settings) setForm(data.settings);
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
    const res = await fetch('/api/admin/email-config', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
    const data = await res.json();
    if (data?.ok !== undefined ? data.ok : res.ok) {
      setMessage('Saved');
    } else {
      setMessage('Failed to save');
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Email Provider Configuration</h1>
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
          <button type="submit">Save</button>
        </div>
        {message && <div style={{ marginTop: 12 }}>{message}</div>}
      </form>
    </div>
  );
}
