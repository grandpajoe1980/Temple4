'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import type { Facility, FacilityBlackout, FacilityBooking } from '@/types';

interface FacilityDetailPageProps {
  tenantId: string;
  facility: Facility & { bookings?: FacilityBooking[]; blackouts?: FacilityBlackout[] };
  isMember: boolean;
}

const typeLabels: Record<string, string> = {
  ROOM: 'Room',
  HALL: 'Hall',
  EQUIPMENT: 'Equipment',
  VEHICLE: 'Vehicle',
  OTHER: 'Other',
};

const fallbackImages: Record<string, string> = {
  ROOM: 'https://images.unsplash.com/photo-1529333166433-8a58c0c3d1e1?auto=format&fit=crop&w=1200&q=80',
  HALL: 'https://images.unsplash.com/photo-1524230572899-a752b3835840?auto=format&fit=crop&w=1200&q=80',
  EQUIPMENT: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=1200&q=80',
  VEHICLE: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
  OTHER: 'https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1200&q=80',
};

const statusStyles: Record<string, string> = {
  REQUESTED: 'tenant-bg-50 tenant-border-200 tenant-text-primary',
  APPROVED: 'bg-green-50 border-green-200 text-green-800',
  REJECTED: 'bg-rose-50 border-rose-200 text-rose-800',
  CANCELLED: 'bg-slate-50 border-slate-200 text-slate-700',
};

function formatRange(start: string | Date, end: string | Date) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return `${startDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })} · ${startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – ${endDate.toLocaleTimeString(
    [],
    { hour: 'numeric', minute: '2-digit' }
  )}`;
}

export default function FacilityDetailPage({ tenantId, facility, isMember }: FacilityDetailPageProps) {
  const toast = useToast();
  const [formState, setFormState] = useState({
    startAt: '',
    endAt: '',
    purpose: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schedule = useMemo(() => {
    const blackoutEntries = (facility.blackouts ?? []).map((blackout) => ({
      id: `blackout-${blackout.id}`,
      type: 'BLACKOUT' as const,
      startAt: blackout.startAt,
      endAt: blackout.endAt,
      title: blackout.reason || 'Unavailable',
    }));

    const bookingEntries = (facility.bookings ?? []).map((booking) => ({
      id: `booking-${booking.id}`,
      type: 'BOOKING' as const,
      startAt: booking.startAt,
      endAt: booking.endAt,
      title: booking.purpose,
      status: booking.status,
      notes: booking.notes,
    }));

    return [...blackoutEntries, ...bookingEntries].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  }, [facility.blackouts, facility.bookings]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const submitRequest = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert datetime-local format to ISO 8601
      const payload = {
        startAt: new Date(formState.startAt).toISOString(),
        endAt: new Date(formState.endAt).toISOString(),
        purpose: formState.purpose,
        notes: formState.notes || undefined,
      };

      const response = await fetch(`/api/tenants/${tenantId}/facilities/${facility.id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Check for validation errors
        if (body.errors) {
          const errorMessages = Object.entries(body.errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
          throw new Error(errorMessages || 'Validation failed');
        }
        throw new Error(body.message || 'Unable to submit booking request');
      }

      toast.success('Booking request submitted. We will confirm availability soon.');
      setFormState({ startAt: '', endAt: '', purpose: '', notes: '' });
    } catch (error: any) {
      console.error('Booking submission error:', error);
      toast.error(error.message || 'Unable to submit booking request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const heroImage = facility.imageUrl || fallbackImages[facility.type] || fallbackImages.OTHER;
  const blackoutCount = (facility.blackouts ?? []).length;
  const bookingCount = (facility.bookings ?? []).length;

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl shadow">
        <div className="relative grid gap-8 md:grid-cols-[1.6fr,1fr]">
          <div className="p-8">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide tenant-text-primary">
              <span className="rounded-full tenant-bg-100 px-3 py-1">{typeLabels[facility.type] ?? facility.type}</span>
              {facility.isActive ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">Accepting requests</span>
              ) : (
                <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Inactive</span>
              )}
              {!isMember && <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">Guests welcome</span>}
            </div>

            <h1 className="mt-4 text-4xl font-bold text-gray-900 leading-tight">{facility.name}</h1>
            {facility.description && (
              <p className="mt-3 max-w-3xl text-lg text-gray-700 leading-relaxed">{facility.description}</p>
            )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {facility.location && (
                <div className="rounded-xl border tenant-border-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide tenant-text-primary">Location</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">{facility.location}</p>
                  <p className="text-sm text-gray-600">Directions available upon request.</p>
                </div>
              )}
              {typeof facility.capacity === 'number' && (
                <div className="rounded-xl border tenant-border-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide tenant-text-primary">Capacity</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">{facility.capacity} guests</p>
                  <p className="text-sm text-gray-600">Ideal for gatherings, rehearsals, and events.</p>
                </div>
              )}
              <div className="rounded-xl border tenant-border-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide tenant-text-primary">Availability</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {facility.isActive ? 'Currently open for scheduling' : 'Temporarily unavailable'}
                </p>
                <p className="text-sm text-gray-600">Blackouts: {blackoutCount || 'None recorded'}.</p>
              </div>
            </div>
          </div>

          <div className="relative h-full min-h-[320px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
            <img src={heroImage} alt={facility.name} className="h-full w-full object-cover" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Bookings logged</p>
                <p className="text-2xl font-bold text-gray-900">{bookingCount}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-gray-500">Updated</p>
                <p className="text-base font-semibold text-gray-900">
                  {new Date(facility.updatedAt ?? Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr,1fr]">
        <Card className="space-y-5 border-0 shadow-lg ring-1 ring-gray-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide tenant-text-primary">Schedule</p>
              <h2 className="text-2xl font-bold text-gray-900">Live availability</h2>
              <p className="text-sm text-gray-600">Reservations and blackout windows are listed in chronological order.</p>
            </div>
              <div className="rounded-full tenant-bg-100 px-4 py-2 text-xs font-semibold tenant-text-primary">
              {schedule.length} scheduled item{schedule.length === 1 ? '' : 's'}
            </div>
          </div>

            {schedule.length === 0 ? (
            <div className="rounded-xl border border-dashed tenant-border-200 tenant-bg-50 p-6 text-sm tenant-text-primary">
              No bookings or blackouts are on the calendar. Submit a request to reserve the space.
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex flex-col gap-2 rounded-xl border p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between ${
                    entry.type === 'BLACKOUT'
                      ? 'border-rose-200 bg-rose-50'
                      : `${statusStyles[(entry as any).status] || 'border-gray-200 bg-gray-50 text-gray-800'}`
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                      <span className="rounded-full bg-white/80 px-3 py-1 text-gray-800">
                        {entry.type === 'BLACKOUT' ? 'Blackout' : (entry as any).status}
                      </span>
                      <span className="text-gray-700">{formatRange(entry.startAt, entry.endAt)}</span>
                    </div>
                    <p className="text-base font-semibold text-gray-900">{entry.title}</p>
                    {'notes' in entry && entry.notes && <p className="text-sm text-gray-700">Notes: {entry.notes}</p>}
                  </div>
                  <div className="text-sm text-gray-700">
                    {entry.type === 'BLACKOUT'
                      ? 'Space unavailable during this window.'
                      : 'Pending confirmation unless noted as approved.'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="border-0 shadow-lg ring-1 ring-gray-100">
            <p className="text-sm font-semibold uppercase tracking-wide tenant-text-primary">Booking request</p>
            <h2 className="text-xl font-bold text-gray-900">Reserve this facility</h2>
            <p className="text-sm text-gray-600">
              Submit a request with your preferred times. Our team will review availability and confirm via email.
            </p>

            {!facility.isActive && (
              <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
                This facility is currently inactive. Requests may take longer to review.
              </div>
            )}
            {!isMember && (
              <div className="mt-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                Guests are welcome. Members receive priority scheduling when conflicts occur.
              </div>
            )}

            <form className="mt-4 space-y-3" onSubmit={submitRequest}>
              <div>
                <label className="text-sm font-medium text-gray-700">Start</label>
                <Input
                  type="datetime-local"
                  name="startAt"
                  value={formState.startAt}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">End</label>
                <Input type="datetime-local" name="endAt" value={formState.endAt} onChange={handleInputChange} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Purpose</label>
                <Input
                  name="purpose"
                  value={formState.purpose}
                  onChange={handleInputChange}
                  placeholder="Rehearsal, class, event..."
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
                <textarea
                  name="notes"
                  value={formState.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Submitting...' : 'Submit request'}
              </Button>
            </form>
          </Card>

          <Card className="border-0 shadow-lg ring-1 ring-gray-100">
            <p className="text-sm font-semibold uppercase tracking-wide tenant-text-primary">Need help?</p>
            <h3 className="text-lg font-bold text-gray-900">Facility concierge</h3>
            <p className="text-sm text-gray-600">
              Share special requirements, equipment needs, or accessibility requests and we will tailor the setup for your visit.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Early load-in or rehearsal accommodations</li>
              <li>• A/V and stage configuration support</li>
              <li>• Staffing and hospitality coordination</li>
            </ul>
            <div className="mt-4 rounded-lg tenant-bg-50 p-3 text-sm text-[color:var(--primary)]">
              Prefer to talk? Visit the concierge desk or email facilities@asembli.com.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
