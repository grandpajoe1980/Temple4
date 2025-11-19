'use client';

import { useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import type { Facility, FacilityBooking } from '@/types';

interface FacilityDetailPageProps {
  tenantId: string;
  facility: Facility & { bookings?: FacilityBooking[] };
  isMember: boolean;
}

const statusColors: Record<string, string> = {
  REQUESTED: 'text-amber-700 bg-amber-50 border border-amber-200',
  APPROVED: 'text-green-700 bg-green-50 border border-green-200',
  REJECTED: 'text-red-700 bg-red-50 border border-red-200',
  CANCELLED: 'text-gray-600 bg-gray-100 border border-gray-200',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const submitRequest = async (e: React.FormEvent) => {
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
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">{facility.type}</p>
          <h1 className="text-2xl font-bold text-gray-900">{facility.name}</h1>
          {facility.description && <p className="text-gray-600">{facility.description}</p>}
          <div className="flex flex-wrap gap-3 text-sm text-gray-700">
            {facility.location && <span className="rounded-full bg-gray-100 px-3 py-1">{facility.location}</span>}
            {typeof facility.capacity === 'number' && <span className="rounded-full bg-gray-100 px-3 py-1">Capacity: {facility.capacity}</span>}
            {!facility.isActive && <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">Inactive</span>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
          <div className="mt-4 space-y-3">
            {(facility.bookings ?? []).length === 0 ? (
              <p className="text-sm text-gray-600">No bookings scheduled.</p>
            ) : (
              <ul className="space-y-3">
                {(facility.bookings ?? []).map((booking) => (
                  <li key={booking.id} className={`rounded-md p-3 text-sm ${statusColors[booking.status] || 'bg-gray-50'}`}>
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-semibold text-gray-900">{new Date(booking.startAt).toLocaleString()} - {new Date(booking.endAt).toLocaleString()}</span>
                      <span className="text-xs uppercase tracking-wide">{booking.status}</span>
                    </div>
                    <p className="text-gray-700">Purpose: {booking.purpose}</p>
                    {booking.notes && <p className="text-gray-600">Notes: {booking.notes}</p>}
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
