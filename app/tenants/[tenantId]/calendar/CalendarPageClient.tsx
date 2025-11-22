'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { EventWithCreator, Event } from '@/types';
import EventsCalendar from '@/app/components/tenant/EventsCalendar';
import Button from '@/app/components/ui/Button';
import Modal from '@/app/components/ui/Modal';
import EventForm from '@/app/components/tenant/EventForm';
import DayEventsModal from '@/app/components/tenant/DayEventsModal';

interface CalendarPageClientProps {
  events: EventWithCreator[];
  tenantId: string;
  canCreateEvent: boolean;
  openCreateModal?: boolean;
  currentUserId?: string;
}

export default function CalendarPageClient({ events, tenantId, canCreateEvent, openCreateModal = false, currentUserId }: CalendarPageClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(openCreateModal);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDayModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    router.push(`/tenants/${tenantId}/calendar`);
  };

  const handleCreateEvent = async (eventData: Omit<Event, 'id' | 'tenantId' | 'createdByUserId'>) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        ...eventData,
        startDateTime: eventData.startDateTime.toISOString(),
        endDateTime: eventData.endDateTime.toISOString(),
      };

      // Ensure we don't send an empty string for `onlineUrl` which will fail zod's url() check.
      if (!eventData.isOnline || !eventData.onlineUrl || eventData.onlineUrl.trim() === '') {
        delete payload.onlineUrl;
        payload.isOnline = !!eventData.isOnline;
      } else {
        payload.onlineUrl = eventData.onlineUrl.trim();
      }

      const response = await fetch(`/api/tenants/${tenantId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let detail = '';
        try {
          const body = await response.json();
          detail = body?.message || JSON.stringify(body);
        } catch (e) {
          try {
            detail = await response.text();
          } catch (_) {
            detail = '<no response body>';
          }
        }

        throw new Error(`Failed to create event: ${detail}`);
      }

      handleCloseCreateModal();
      router.refresh();
    } catch (error: any) {
      console.error('Error creating event:', error);
      const message = error?.message || 'Unable to create the event right now. Please try again.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calendarEvents = useMemo(() => events, [events]);
  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((event) => {
      const eventDate = new Date(event.startDateTime);
      return (
        eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate()
      );
    });
  }, [events, selectedDate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-600">Stay up to date with everything happening in your community.</p>
        </div>
        {canCreateEvent && (
          <Link href={`/tenants/${tenantId}/calendar/new`}>
            <Button>+ New Event</Button>
          </Link>
        )}
      </div>
      <EventsCalendar events={calendarEvents} onDateClick={handleDateClick} />
      {selectedDate && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            Selected date: {selectedDate.toLocaleDateString()}
          </p>
        </div>
      )}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="Create a New Event"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold">1</span>
            <p className="font-medium text-gray-900">Add the basics for your gathering.</p>
          </div>
          <EventForm
            onSubmit={handleCreateEvent}
            onCancel={handleCloseCreateModal}
            isSubmitting={isSubmitting}
          />
        </div>
      </Modal>
      {selectedDate && (
        <DayEventsModal
          isOpen={isDayModalOpen}
          onClose={() => setIsDayModalOpen(false)}
          date={selectedDate}
          events={eventsForSelectedDay}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
