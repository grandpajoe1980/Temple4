"use client"

import React, { useEffect, useState } from 'react';
// Map server event DTOs locally to avoid importing server-only helpers
import type { EventWithCreator, Tenant } from '@/types';
import EventCard from '../tenant/EventCard';

interface PublicEventsViewProps {
  tenant: Tenant;
}

const PublicEventsView: React.FC<PublicEventsViewProps> = ({ tenant }) => {
  const [events, setEvents] = useState<EventWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      try {
        const response = await fetch(`/api/tenants/${tenant.id}/events`);
        if (!response.ok) {
          setEvents([]);
          return;
        }

        const payload = await response.json();
        if (!isMounted) return;

        const normalized = (payload || []).map((event: any) => ({
          id: event.id,
          tenantId: event.tenantId,
          createdByUserId: event.createdByUserId,
          title: event.title,
          description: event.description,
          startDateTime: new Date(event.startDateTime),
          endDateTime: new Date(event.endDateTime),
          locationText: event.locationText,
          isOnline: event.isOnline,
          onlineUrl: event.onlineUrl ?? null,
          deletedAt: null,
          creatorDisplayName: event.creatorDisplayName,
          creatorAvatarUrl: event.creatorAvatarUrl ?? undefined,
          rsvpCount: event.rsvpCount ?? 0,
          currentUserRsvpStatus: event.currentUserRsvpStatus ?? null,
        } as any));

        setEvents(normalized);
      } catch (error) {
        setEvents([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, [tenant.id]);

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading events...</div>;
  }

  return (
    <div className="space-y-6">
      {events.length > 0 ? (
        events.map((event: any) => <EventCard key={event.id} event={event} />)
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Events Scheduled</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no upcoming events at this time.
          </p>
        </div>
      )}
    </div>
  );
};

export default PublicEventsView;
