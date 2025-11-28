"use client";
import React, { useState } from 'react';

export default function ExportAttendeesButton({ tenantId, eventId }: { tenantId: string; eventId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/events/${eventId}/attendees/export`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to export');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendees-${eventId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="px-3 py-1 bg-gray-700 text-white rounded" onClick={onExport} disabled={loading}>{loading ? 'Exporting…' : 'Export CSV'}</button>
      {error && <div className="text-red-600 mt-1">{error}</div>}
    </div>
  );
}
