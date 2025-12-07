import React from 'react';
import type { EnrichedTrip } from '@/types';

interface TripCardProps {
  trip: EnrichedTrip;
  onOpen?: () => void;
}

const formatDateRange = (start?: Date | string | null, end?: Date | string | null) => {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (startDate && endDate) {
    return `${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()}`;
  }
  if (startDate) return startDate.toLocaleDateString();
  return 'Date TBA';
};

export default function TripCard({ trip, onOpen }: TripCardProps) {
  const approvedMembers = (trip.members || []).filter((m) => m.status === 'APPROVED');
  const capacity = trip.capacity || 0;
  const progress = capacity > 0 ? Math.min(100, Math.round((approvedMembers.length / capacity) * 100)) : 0;

  return (
    <button
      onClick={onOpen}
      className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{trip.name}</h3>
            {trip.destination ? <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.08)', color: 'rgba(var(--primary-rgb), 0.90)'}}>{trip.destination}</span> : null}
          </div>
          <p className="text-sm text-gray-600">{trip.summary || trip.description || 'Gather your group for the next adventure.'}</p>
          <div className="mt-2 text-xs text-gray-500">{formatDateRange(trip.startDate, trip.endDate)}</div>
          {trip.costCents ? (
            <div className="mt-1 text-sm font-medium text-gray-800">
              Cost: {(trip.costCents / 100).toLocaleString(undefined, { style: 'currency', currency: trip.currency || 'USD' })}
            </div>
          ) : null}
        </div>
        {capacity > 0 ? (
          <div className="text-right">
            <div className="text-xs font-semibold text-gray-700">
              {approvedMembers.length}/{capacity} spots
            </div>
            <div className="mt-1 h-2 w-24 overflow-hidden rounded-full bg-gray-100">
              <div className="h-2" style={{ width: `${progress}%`, backgroundColor: 'var(--primary)' }} />
            </div>
          </div>
        ) : null}
      </div>
    </button>
  );
}
