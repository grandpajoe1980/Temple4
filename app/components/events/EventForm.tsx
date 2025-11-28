'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface VolunteerRole {
  roleName: string;
  capacity: number;
}

export default function EventForm({ tenantId, event, onCreated, onSaved }: { tenantId: string; event?: any; onCreated?: (e: any) => void; onSaved?: (e: any) => void }) {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [startDateTime, setStartDateTime] = useState(event?.startDateTime ? new Date(event.startDateTime).toISOString().slice(0, 16) : '');
  const [endDateTime, setEndDateTime] = useState(event?.endDateTime ? new Date(event.endDateTime).toISOString().slice(0, 16) : '');
  const [visibility, setVisibility] = useState(event?.visibility || 'MEMBERS_ONLY');
  const [locationText, setLocationText] = useState(event?.locationText || '');
  const [registrationRequired, setRegistrationRequired] = useState(event?.registrationRequired || false);
  const [capacityLimit, setCapacityLimit] = useState<string>(event?.capacityLimit?.toString() || '');
  const [waitlistEnabled, setWaitlistEnabled] = useState(event?.waitlistEnabled || false);
  const [volunteerRoles, setVolunteerRoles] = useState<VolunteerRole[]>([]);

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Volunteer role input state
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleCapacity, setNewRoleCapacity] = useState(1);

  function addVolunteerRole() {
    if (!newRoleName.trim()) return;
    setVolunteerRoles([...volunteerRoles, { roleName: newRoleName, capacity: newRoleCapacity }]);
    setNewRoleName('');
    setNewRoleCapacity(1);
  }

  function removeVolunteerRole(index: number) {
    setVolunteerRoles(volunteerRoles.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let posterStorageKey: string | undefined;
      let posterUrl: string | undefined;
      if (posterFile) {
        setUploadingPoster(true);
        const fd = new FormData();
        fd.append('file', posterFile as Blob, posterFile.name);
        fd.append('tenantId', tenantId);
        fd.append('category', 'photos');

        const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!upRes.ok) {
          const txt = await upRes.text();
          throw new Error(txt || 'Poster upload failed');
        }
        const upJson = await upRes.json();
        posterStorageKey = upJson.storageKey;
        posterUrl = upJson.url;
        setUploadingPoster(false);
      }

      const payload: any = {
        title,
        description,
        visibility,
        locationText,
        registrationRequired,
        waitlistEnabled,
        posterStorageKey,
        posterUrl
      };

      if (startDateTime) payload.startDateTime = new Date(startDateTime).toISOString();
      if (endDateTime) payload.endDateTime = new Date(endDateTime).toISOString();
      if (capacityLimit) payload.capacityLimit = parseInt(capacityLimit);
      if (volunteerRoles.length > 0) payload.volunteerRoles = volunteerRoles;

      let res: Response;
      if (event?.id) {
        // Update existing event
        res = await fetch(`/api/tenants/${tenantId}/events/${event.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/tenants/${tenantId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create event');
      }

      const data = await res.json();
      if (event?.id) {
        onSaved?.(data);
      } else {
        onCreated?.(data);
        // Reset form
        setTitle('');
        setDescription('');
        setStartDateTime('');
        setEndDateTime('');
        setVolunteerRoles([]);
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Event Details</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700">Title <span className="text-red-500">*</span></label>
          <input
            required
            className="mt-1 w-full border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Sunday Service, Youth Group Picnic"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            className="mt-1 w-full border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the event..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Start Time <span className="text-red-500">*</span></label>
            <input
              required
              type="datetime-local"
              className="mt-1 w-full border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={startDateTime}
              onChange={e => setStartDateTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">End Time</label>
            <input
              type="datetime-local"
              className="mt-1 w-full border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={endDateTime}
              onChange={e => setEndDateTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Location</label>
          <input
            className="mt-1 w-full border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={locationText}
            onChange={e => setLocationText(e.target.value)}
            placeholder="e.g. Main Hall, Zoom Link, 123 Main St"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Poster Image</label>
          <div className="mt-1 flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              onChange={e => setPosterFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {uploadingPoster && <p className="text-sm text-indigo-600 mt-1">Uploading...</p>}
        </div>
      </div>

      {/* Visibility & Registration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2 pt-4">Visibility & Registration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Visibility</label>
            <select
              className="mt-1 w-full border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={visibility}
              onChange={e => setVisibility(e.target.value)}
            >
              <option value="PUBLIC">Public (Visible to everyone)</option>
              <option value="MEMBERS_ONLY">Members Only (Logged in)</option>
              <option value="PRIVATE_LINK">Private (Link only)</option>
            </select>
          </div>

          <div className="flex items-center pt-6">
            <input
              id="reg-required"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={registrationRequired}
              onChange={e => setRegistrationRequired(e.target.checked)}
            />
            <label htmlFor="reg-required" className="ml-2 block text-sm text-slate-900">
              Registration Required (RSVP)
            </label>
          </div>
        </div>

        {registrationRequired && (
          <div className="bg-slate-50 p-4 rounded-md space-y-4 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Capacity Limit</label>
                <input
                  type="number"
                  min="1"
                  className="mt-1 w-full border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={capacityLimit}
                  onChange={e => setCapacityLimit(e.target.value)}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div className="flex items-center pt-6">
                <input
                  id="waitlist"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={waitlistEnabled}
                  onChange={e => setWaitlistEnabled(e.target.checked)}
                />
                <label htmlFor="waitlist" className="ml-2 block text-sm text-slate-900">
                  Enable Waitlist when full
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Volunteer Roles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2 pt-4">Volunteer Opportunities</h3>
        <p className="text-sm text-slate-500">Add roles if you need members to sign up to help (e.g. Setup Crew, Greeters).</p>

        <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
          <div className="flex gap-2 mb-4">
            <input
              placeholder="Role Name (e.g. Greeter)"
              className="flex-1 border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
            />
            <input
              type="number"
              min="1"
              placeholder="Qty"
              className="w-20 border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={newRoleCapacity}
              onChange={e => setNewRoleCapacity(parseInt(e.target.value))}
            />
            <button
              type="button"
              onClick={addVolunteerRole}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
            >
              Add
            </button>
          </div>

          {volunteerRoles.length > 0 ? (
            <ul className="space-y-2">
              {volunteerRoles.map((role, idx) => (
                <li key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                  <span className="text-sm font-medium text-slate-900">{role.roleName} <span className="text-slate-500 font-normal">({role.capacity} needed)</span></span>
                  <button type="button" onClick={() => removeVolunteerRole(idx)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 italic">No volunteer roles added yet.</p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="pt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : (event?.id ? 'Save Changes' : 'Create Event')}
        </button>
      </div>
    </form>
  );
}
