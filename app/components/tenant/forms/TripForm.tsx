import React, { useState } from 'react';

export interface TripFormValues {
  name: string;
  summary?: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  meetingPoint?: string;
  capacity?: number;
  costCents?: number | null;
  currency?: string;
  depositCents?: number | null;
  fundraisingEnabled?: boolean;
  fundraisingGoalCents?: number | null;
  allowSponsorship?: boolean;
  joinPolicy?: 'OPEN' | 'APPROVAL';
  waiverRequired?: boolean;
  allowMessages?: boolean;
  allowPhotos?: boolean;
  isPublic?: boolean;
}

interface TripFormProps {
  initial?: Partial<TripFormValues>;
  isEdit?: boolean;
  submitting?: boolean;
  onSubmit: (values: TripFormValues) => void;
  onCancel?: () => void;
}

export default function TripForm({ initial, onSubmit, onCancel, isEdit, submitting }: TripFormProps) {
  const [form, setForm] = useState<TripFormValues>({
    name: initial?.name || '',
    summary: initial?.summary || '',
    description: initial?.description || '',
    destination: initial?.destination || '',
    startDate: initial?.startDate || '',
    endDate: initial?.endDate || '',
    meetingPoint: initial?.meetingPoint || '',
    capacity: initial?.capacity,
    costCents: initial?.costCents ?? null,
    currency: initial?.currency || 'USD',
    depositCents: initial?.depositCents ?? null,
    fundraisingEnabled: initial?.fundraisingEnabled ?? false,
    fundraisingGoalCents: initial?.fundraisingGoalCents ?? null,
    allowSponsorship: initial?.allowSponsorship ?? false,
    joinPolicy: initial?.joinPolicy || 'APPROVAL',
    waiverRequired: initial?.waiverRequired ?? false,
    allowMessages: initial?.allowMessages ?? true,
    allowPhotos: initial?.allowPhotos ?? true,
    isPublic: initial?.isPublic ?? false,
  });

  const parseMoneyToCents = (value: string) => {
    const num = Number(value);
    return Number.isNaN(num) ? null : Math.round(num * 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      costCents: parseMoneyToCents((document.getElementById('trip-cost') as HTMLInputElement)?.value || '') ?? null,
      depositCents: parseMoneyToCents((document.getElementById('trip-deposit') as HTMLInputElement)?.value || '') ?? null,
      fundraisingGoalCents: parseMoneyToCents((document.getElementById('trip-fundraising-goal') as HTMLInputElement)?.value || '') ?? null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Trip name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary-tint-50)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Destination</label>
          <input
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary-tint-50)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Meeting point</label>
          <input
            value={form.meetingPoint}
            onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary-tint-50)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Start date</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary-tint-50)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End date</label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary-tint-50)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Capacity</label>
          <input
            type="number"
            min={0}
            value={form.capacity ?? ''}
            onChange={(e) => setForm({ ...form, capacity: e.target.value ? Number(e.target.value) : undefined })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary-tint-50)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cost per person (USD)</label>
          <input
            id="trip-cost"
            type="number"
            min="0"
            step="0.01"
            defaultValue={typeof form.costCents === 'number' ? (form.costCents / 100).toString() : ''}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary-tint-50)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Deposit (USD)</label>
          <input
            id="trip-deposit"
            type="number"
            min="0"
            step="0.01"
            defaultValue={typeof form.depositCents === 'number' ? (form.depositCents / 100).toString() : ''}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary-tint-50)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fundraising goal (USD)</label>
          <input
            id="trip-fundraising-goal"
            type="number"
            min="0"
            step="0.01"
            defaultValue={typeof form.fundraisingGoalCents === 'number' ? (form.fundraisingGoalCents / 100).toString() : ''}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary-tint-50)]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Summary</label>
          <textarea
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary-tint-50)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary-tint-50)]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.fundraisingEnabled}
            onChange={(e) => setForm({ ...form, fundraisingEnabled: e.target.checked })}
          />
          Enable fundraiser
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.allowSponsorship}
            onChange={(e) => setForm({ ...form, allowSponsorship: e.target.checked })}
          />
          Allow sponsorship (donate to a specific person)
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.waiverRequired}
            onChange={(e) => setForm({ ...form, waiverRequired: e.target.checked })}
          />
          Waiver required
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
          />
          Public trip page
        </label>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Join policy</label>
        <select
          value={form.joinPolicy}
          onChange={(e) => setForm({ ...form, joinPolicy: e.target.value as 'OPEN' | 'APPROVAL' })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary-tint-50)]"
        >
          <option value="APPROVAL">Approval required</option>
          <option value="OPEN">Open join</option>
        </select>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:border-gray-300"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md tenant-active-strong px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-sm hover:tenant-active-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create trip'}
        </button>
      </div>
    </form>
  );
}
