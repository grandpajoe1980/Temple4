"use client";

import React, { useMemo, useState } from 'react';
import type { Tenant, User } from '@prisma/client';
import type { EnrichedTrip } from '@/types';
import Button from '../ui/Button';
import CommunityChips from './CommunityChips';
import CommunityHeader from './CommunityHeader';
import Modal from '../ui/Modal';
import TripForm, { TripFormValues } from './forms/TripForm';
import TripCard from './TripCard';
import TripDetail from './TripDetail';

interface TripsPageProps {
  tenant: Pick<Tenant, 'id' | 'name'>;
  user: User & { profile: any; privacySettings: any; accountSettings: any };
  trips: EnrichedTrip[];
  onRefresh?: () => void;
  isAdmin?: boolean;
}

const TripsPage: React.FC<TripsPageProps> = ({ tenant, user, trips, onRefresh, isAdmin }) => {
  const uniqueTrips = useMemo(() => {
    const map: Record<string, EnrichedTrip> = {};
    (trips || []).forEach((t) => {
      map[t.id] = t;
    });
    return Object.values(map);
  }, [trips]);

  const visibleTrips = uniqueTrips.filter((t) => t.status !== 'ARCHIVED');
  const completedTrips = visibleTrips.filter((t) => t.status === 'COMPLETED');
  const activeTrips = visibleTrips.filter((t) => t.status !== 'COMPLETED');
  const sortedTrips = [...activeTrips, ...completedTrips];
  const [selectedTripId, setSelectedTripId] = useState<string | null>(sortedTrips.length > 0 ? sortedTrips[0].id : null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (values: TripFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tenants/${(tenant as any).id}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          startDate: values.startDate || undefined,
          endDate: values.endDate || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error((body && body.message) || res.statusText || `HTTP ${res.status}`);
      }
      if (onRefresh) {
        onRefresh();
      } else if (typeof window !== 'undefined') {
        window.location.reload();
      }
      setIsModalOpen(false);
      alert('Trip created');
    } catch (err: any) {
      console.error('Failed to create trip', err);
      alert(err?.message || 'Failed to create trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <CommunityChips tenantId={(tenant as any).id} />
      <CommunityHeader
        title={<>Trips</>}
        subtitle={<>Plan, coordinate, and fund trips for your community. Track signups, logistics, and fundraising in one place.</>}
        actions={
          isAdmin ? (
            <Button data-test="create-trip-trigger" variant="primary" onClick={() => setIsModalOpen(true)}>
              Create Trip
            </Button>
          ) : null
        }
      />

      {visibleTrips.length > 0 ? (
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="lg:w-1/3 max-h-[70vh] overflow-y-auto space-y-4 pr-2">
            {sortedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onOpen={() => setSelectedTripId(trip.id)} />
            ))}
          </div>
          <div className="lg:w-2/3 max-h-[70vh] overflow-y-auto">
            <TripDetail
              tenantId={(tenant as any).id}
              tripId={selectedTripId}
              currentUser={user}
              onRefresh={onRefresh}
              onClose={() => setSelectedTripId(null)}
              isAdmin={!!isAdmin}
            />
          </div>
        </div>
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Trips Yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Launch your first community trip with key details like dates, itinerary, and fundraising goals.
          </p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} dataTest="create-trip-modal" title="Create trip">
        <TripForm onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} submitting={isSubmitting} />
      </Modal>
    </div>
  );
};

export default TripsPage;
