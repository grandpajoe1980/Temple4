'use client';
import React, { useEffect, useState } from 'react';
import EventCard from './EventCard';
import RSVPModal from './RSVPModal';
import { useSetPageHeader } from '../ui/PageHeaderContext';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button';

export default function CalendarClient({ tenantId }: { tenantId: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const router = useRouter();
  const setPageHeader = useSetPageHeader();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tenants/${tenantId}/events`);
        const data = await res.json();
        if (mounted) setEvents(data);
        try {
          const meRes = await fetch(`/api/tenants/${tenantId}/me`);
          if (meRes.ok) {
            const meJson = await meRes.json();
            if (mounted) setIsAdmin(Boolean(meJson?.permissions?.isAdmin || meJson?.permissions?.canCreateEvents));
          }
        } catch (e) {
          console.error('Failed to fetch tenant/me', e);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [tenantId]);

  useEffect(() => {
    setPageHeader({
      title: 'Events',
      actions: isAdmin ? (
        <Button size="sm" onClick={() => router.push(`/tenants/${tenantId}/events/new`)}>+ New</Button>
      ) : undefined,
    });
    return () => setPageHeader(null);
  }, [isAdmin, setPageHeader, router, tenantId]);

  return (
    <div className="space-y-8">

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
          <p className="text-slate-500">No upcoming events scheduled.</p>
          {isAdmin && (
            <button
              onClick={() => router.push(`/tenants/${tenantId}/events/new`)}
              className="mt-4 text-indigo-600 font-medium hover:underline"
            >
              Create the first one
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(() => {
          // Filter for unique recurrences (show next upcoming)
          const now = new Date();
          const processedEvents = new Map<string, any>();
          const singleEvents: any[] = [];

          // Sort by date first to make finding "next" easier
          const sortedEvents = [...events].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

          sortedEvents.forEach(ev => {
            if (ev.recurrenceGroupId) {
              const existing = processedEvents.get(ev.recurrenceGroupId);
              const evDate = new Date(ev.startDateTime);

              // If we haven't seen this group, or the existing one is past and this one is future (or closer to now)
              if (!existing) {
                processedEvents.set(ev.recurrenceGroupId, ev);
              } else {
                const existingDate = new Date(existing.startDateTime);
                // If existing is in past, and this one is in future (or closer to being current)
                if (existingDate < now && evDate >= now) {
                  processedEvents.set(ev.recurrenceGroupId, ev);
                }
                // If both are future, keep the earlier one (already sorted, so first seen is earlier)
                // If both are past, keep the later one? (Sorted ASC, so later one comes later in loop. We want the one closest to now?)
                // If both past, we usually want the *last* one (most recent past).
                else if (existingDate < now && evDate < now) {
                  processedEvents.set(ev.recurrenceGroupId, ev);
                }
              }
            } else {
              singleEvents.push(ev);
            }
          });

          const uniqueRecurring = Array.from(processedEvents.values());
          const displayList = [...singleEvents, ...uniqueRecurring].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

          return displayList.map(ev => (
            <EventCard
              key={ev.id}
              event={ev}
              onOpen={id => setSelectedEventId(id)}
              tenantId={tenantId}
              isAdmin={isAdmin}
              onDelete={(id: string) => setEvents((prev) => prev.filter((e) => e.id !== id))}
            />
          ));
        })()}
      </div>
      {selectedEventId && <RSVPModal tenantId={tenantId} eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />}
    </div>
  );
}
