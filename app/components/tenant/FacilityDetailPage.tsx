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

const statusColors: Record<string, string> = {
  REQUESTED: 'text-amber-700 bg-amber-50 border border-amber-200',
  APPROVED: 'text-green-700 bg-green-50 border border-green-200',
  REJECTED: 'text-red-700 bg-red-50 border border-red-200',
  CANCELLED: 'text-gray-600 bg-gray-100 border border-gray-200',
};

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
      const response = await fetch(`/api/tenants/${tenantId}/facilities/${facility.id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Unable to submit booking request');
      }

      toast.success('Booking request submitted. We will confirm availability soon.');
      setFormState({ startAt: '', endAt: '', purpose: '', notes: '' });
    } catch (error: any) {
      toast.error(error.message || 'Unable to submit booking request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <div className="space-y-3">
            <div className="relative h-56 overflow-hidden rounded-lg bg-gray-100">
              <img
                src={facility.imageUrl || fallbackImages[facility.type] || fallbackImages.OTHER}
                alt={facility.name}
                className="h-full w-full object-cover"
              />
              {!facility.isActive && (
                <div className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-800">
                  Inactive
                </div>
              )}
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {typeLabels[facility.type] ?? facility.type}
            </p>
            <h1 className="text-3xl font-bold text-gray-900">{facility.name}</h1>
            {facility.description && <p className="text-gray-700 leading-relaxed">{facility.description}</p>}
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              {facility.location && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Location</p>
                  <p className="font-semibold text-gray-900">{facility.location}</p>
                </div>
              )}
              {typeof facility.capacity === 'number' && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Capacity</p>
                  <p className="font-semibold text-gray-900">{facility.capacity} guests</p>
                </div>
              )}
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Availability</p>
                <p className="font-semibold text-gray-900">
                  {facility.isActive ? 'Accepting new bookings' : 'Temporarily inactive'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Blackout dates</p>
                <p className="font-semibold text-gray-900">{(facility.blackouts ?? []).length || 'None'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Facility schedule</h2>
              <p className="text-sm text-gray-600">Upcoming reservations and blackout times.</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Live calendar</span>
          </div>
          <div className="mt-4 space-y-3">
            {schedule.length === 0 ? (
              <p className="text-sm text-gray-600">No bookings scheduled.</p>
            ) : (
              <ul className="space-y-3">
                {schedule.map((entry) => (
                  <li
                    key={entry.id}
                    className={`rounded-md border p-3 text-sm ${
                      entry.type === 'BLACKOUT'
                        ? 'border-red-200 bg-red-50 text-red-800'
                        : statusColors[(entry as any).status] || 'bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900">
                        {new Date(entry.startAt).toLocaleString()} - {new Date(entry.endAt).toLocaleString()}
                      </span>
                      <span className="text-xs uppercase tracking-wide">
                        {entry.type === 'BLACKOUT' ? 'Blackout' : (entry as any).status}
                      </span>
                    </div>
                    <p className="text-gray-700">
                      {entry.type === 'BLACKOUT' ? 'Unavailable: ' : 'Purpose: '} {entry.title}
                    </p>
                    {'notes' in entry && entry.notes && <p className="text-gray-600">Notes: {entry.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Request a Booking</h2>
          {!facility.isActive && (
            <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
              This facility is currently inactive. Requests may be delayed.
            </div>
          )}
          {!isMember && (
            <div className="mb-3 rounded-md bg-blue-50 p-3 text-sm text-blue-700">Members are prioritized for booking requests.</div>
          )}
          <form className="space-y-3" onSubmit={submitRequest}>
            <div>
              <label className="text-sm font-medium text-gray-700">Start</label>
              <Input type="datetime-local" name="startAt" value={formState.startAt} onChange={handleInputChange} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">End</label>
              <Input type="datetime-local" name="endAt" value={formState.endAt} onChange={handleInputChange} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Purpose</label>
              <Input name="purpose" value={formState.purpose} onChange={handleInputChange} placeholder="Rehearsal, class, event..." required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
              <textarea
                name="notes"
                value={formState.notes}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                rows={3}
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
