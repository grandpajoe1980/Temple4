"use client";
import React, { useState } from 'react';

export default function PromoteButton({ tenantId, eventId, rsvpId }: { tenantId: string; eventId: string; rsvpId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPromote() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/events/${eventId}/waitlist/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvpId }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed');
      }
      // simple refresh to show updated state
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button disabled={loading} onClick={onPromote} className="px-3 py-1 bg-blue-600 text-white rounded">
        {loading ? 'Promoting…' : 'Promote'}
      </button>
      {error && <div className="text-red-600 mt-1">{error}</div>}
    </div>
  );
}
