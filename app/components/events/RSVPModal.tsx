'use client';
import React, { useState, useEffect } from 'react';

export default function RSVPModal({ tenantId, eventId, onClose, onRsvped }: { tenantId: string; eventId: string; onClose?: () => void; onRsvped?: (r: any) => void }) {
  const [status, setStatus] = useState<'GOING' | 'INTERESTED' | 'NOT_GOING'>('GOING');
  const [notes, setNotes] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volunteerRoles, setVolunteerRoles] = useState<Array<any>>([]);
  const [volunteerRoleId, setVolunteerRoleId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false); // We'll detect this based on session check failure or 401 if we were doing it properly, but for now we'll just show fields if needed or let user toggle. 
  // Actually, better pattern: try to RSVP as user, if 401, show guest fields. 
  // Or simpler: just always show optional guest fields if not logged in? 
  // For this iteration, let's assume we might be logged in.

  useEffect(() => {
    let mounted = true;
    async function loadRoles() {
      try {
        const res = await fetch(`/api/tenants/${tenantId}/events/${eventId}/volunteer-roles`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setVolunteerRoles(data || []);
      } catch (e) {
        // ignore
      }
    }
    loadRoles();
    return () => { mounted = false; };
  }, [tenantId, eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: any = { status, notes };
      if (volunteerRoleId) payload.volunteerRoleId = volunteerRoleId;
      if (guestName) payload.guestName = guestName;
      if (guestEmail) payload.guestEmail = guestEmail;

      const res = await fetch(`/api/tenants/${tenantId}/events/${eventId}/rsvps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }

      const data = await res.json();
      onRsvped?.(data);
      onClose?.();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">RSVP for Event</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Will you be attending?</label>
            <div className="flex gap-2">
              {['GOING', 'INTERESTED', 'NOT_GOING'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s as any)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md border ${status === s
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {s === 'GOING' ? 'Going' : s === 'INTERESTED' ? 'Interested' : 'Not Going'}
                </button>
              ))}
            </div>
          </div>

          {/* Guest Fields - simplified logic: always show, backend handles if user is actually logged in (ignores these) or not */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-2">If you are not logged in, please provide your details:</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Name</label>
              <input
                className="mt-1 w-full border-slate-300 rounded-md text-sm"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                className="mt-1 w-full border-slate-300 rounded-md text-sm"
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
          </div>

          {status === 'GOING' && volunteerRoles.length > 0 && (
            <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
              <label className="block text-sm font-medium text-indigo-900 mb-2">Want to help out?</label>
              <select
                value={volunteerRoleId ?? ''}
                onChange={e => setVolunteerRoleId(e.target.value || null)}
                className="w-full border-indigo-200 rounded-md text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">-- No, just attending --</option>
                {volunteerRoles.map(r => (
                  <option key={r.id} value={r.id} disabled={r._count?.rsvps >= r.capacity}>
                    {r.roleName} ({r.capacity - (r._count?.rsvps || 0)} spots left)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">Notes (Dietary, etc.)</label>
            <textarea
              className="mt-1 w-full border-slate-300 rounded-md shadow-sm text-sm"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</p>}

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Confirm RSVP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
