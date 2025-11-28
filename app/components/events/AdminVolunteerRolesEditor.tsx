"use client";
import React, { useEffect, useState } from 'react';

export default function AdminVolunteerRolesEditor({ tenantId, eventId }: { tenantId: string; eventId: string }) {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [capacity, setCapacity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/events/${eventId}/volunteer-roles`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRoles(data || []);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Error');
    }
  }

  useEffect(() => { load(); }, [tenantId, eventId]);

  async function createRole(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/events/${eventId}/volunteer-roles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roleName, capacity }) });
      if (!res.ok) throw new Error(await res.text());
      setRoleName(''); setCapacity(1);
      await load();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Error creating role');
    } finally { setLoading(false); }
  }

  async function deleteRole(id: string) {
    if (!confirm('Delete this role?')) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/events/${eventId}/volunteer-roles/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Error deleting');
    } finally { setLoading(false); }
  }

  return (
    <div className="mt-6 border p-4 rounded">
      <h3 className="text-lg font-semibold">Manage Volunteer Roles</h3>
      {error && <div className="text-red-600">{error}</div>}
      <form onSubmit={createRole} className="mt-3 flex gap-2">
        <input placeholder="Role name" value={roleName} onChange={e => setRoleName(e.target.value)} className="border p-2 rounded w-64" />
        <input type="number" min={1} value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="border p-2 rounded w-24" />
        <button className="px-3 py-1 bg-green-600 text-white rounded" disabled={loading}>{loading ? 'Saving…' : 'Add'}</button>
      </form>

      <div className="mt-4 space-y-2">
        {roles.map(r => (
          <div key={r.id} className="flex items-center justify-between border p-2 rounded">
            <div>
              <div className="font-medium">{r.roleName}</div>
              <div className="text-sm text-gray-600">Capacity: {r.capacity}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => deleteRole(r.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
