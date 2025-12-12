"use client"

import React, { useState, useEffect, useMemo } from 'react';
import type { Tenant, User, Event, EventWithCreator } from '@/types';
import Button from '../ui/Button';
import EventCard from './EventCard';
// Use server-provided permissions via API instead of importing server helpers
import Modal from '../ui/Modal';
import EventForm from './EventForm';
import EventsCalendar from './EventsCalendar';
import DayEventsModal from './DayEventsModal';
import { useToast } from '../ui/Toast';
import { DayPicker } from 'react-day-picker';
import { useSetPageHeader } from '../ui/PageHeaderContext';
import useTranslation from '@/app/hooks/useTranslation';

interface EventsPageProps {
  tenant: Tenant;
  user: User;
}

type ViewMode = 'list' | 'calendar';

const EventsPage: React.FC<EventsPageProps> = ({ tenant, user }) => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventWithCreator[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarFocusDate, setCalendarFocusDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<EventWithCreator | null>(null);
  const toast = useToast();

  // Load events on mount
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tenants/${tenant.id}/events`);
        const eventData: EventWithCreator[] = await response.json();
        const normalizedEvents = eventData.map((event) => ({
          ...event,
          startDateTime: new Date(event.startDateTime),
          endDateTime: new Date(event.endDateTime),
        }));
        setEvents(normalizedEvents);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadEvents();
  }, [tenant.id]);
  const [permissions, setPermissions] = React.useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/me`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setPermissions(data.permissions || null);
      } catch (err) {
        console.error('Failed to load permissions', err);
      }
    })();
    return () => { mounted = false; };
  }, [tenant.id]);

  const canCreate = Boolean(permissions?.canCreateEvents);
  const setPageHeader = useSetPageHeader();

  useEffect(() => {
    setPageHeader({
      title: t('events.title'),
      actions: canCreate ? (
        <Button size="sm" data-test="create-event-trigger" onClick={() => setIsModalOpen(true)}>+ {t('common.new')}</Button>
      ) : undefined,
    });
    return () => setPageHeader(null);
  }, [canCreate, setPageHeader, t]);

  const handleCreateEvent = async (eventData: Omit<Event, 'id' | 'tenantId' | 'createdByUserId'>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tenants/${tenant.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventData,
          startDateTime: eventData.startDateTime.toISOString(),
          endDateTime: eventData.endDateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      // Reload events after creating
      const updatedEventsResponse = await fetch(`/api/tenants/${tenant.id}/events`);
      const updatedEvents: EventWithCreator[] = await updatedEventsResponse.json();
      setEvents(
        updatedEvents.map((event) => ({
          ...event,
          startDateTime: new Date(event.startDateTime),
          endDateTime: new Date(event.endDateTime),
        }))
      );
      setIsModalOpen(false);
      toast.success(t('events.createSuccess'));
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error(t('events.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setCalendarFocusDate(date);
    setDayModalOpen(true);
  };

  const handleEventClick = (event: EventWithCreator) => {
    setSelectedEvent(event);
  };

  const dayPickerEvents = useMemo(() => {
    const uniqueDates = new Set<string>();
    events.forEach(event => {
      const dateKey = new Date(event.startDateTime).toDateString();
      uniqueDates.add(dateKey);
    });
    return Array.from(uniqueDates).map(dateString => new Date(dateString));
  }, [events]);

  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(event => {
      const eventDate = new Date(event.startDateTime);
      return (
        eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate()
      );
    });
  }, [events, selectedDate]);

  if (isLoading) {
    return (
      <div className="space-y-8">

        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <p className="text-gray-500">{t('events.loadingEvents')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end items-center">
        <div className="bg-gray-200 p-1 rounded-lg flex space-x-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white text-gray-800 shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-300'
              }`}
          >
            {t('events.calendar')}
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-300'
              }`}
          >
            {t('events.list')}
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Jump to any date</h3>
                <p className="text-sm text-gray-500">Tap a day to instantly view what’s planned.</p>
              </div>
              <DayPicker
                mode="single"
                selected={selectedDate ?? undefined}
                onSelect={(date) => date && handleDateClick(date)}
                month={calendarFocusDate}
                onMonthChange={(date) => setCalendarFocusDate(date)}
                showOutsideDays
                fixedWeeks
                modifiers={{ hasEvents: dayPickerEvents }}
                modifiersClassNames={{ hasEvents: 'rdp-day-has-events' }}
                captionLayout="dropdown"
                className="rdp-modern"
              />
              <p className="text-xs text-gray-500 mt-3">
                Dates with a subtle glow have scheduled gatherings. Selecting one opens the day overview.
              </p>
            </div>
          </div>
          <div className="min-h-[560px]">
            <EventsCalendar
              events={events}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              focusDate={calendarFocusDate}
              currentUserId={user.id}
            />
          </div>
        </div>
      ) : (
        <>
          {events.length > 0 ? (
            <div className="space-y-6">
              {events.map((event: EventWithCreator) => (
                <EventCard key={event.id} event={event} currentUserId={user.id} />
              ))}
            </div>
          ) : (
            <div className="text-center bg-white p-12 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">{t('events.noEventsScheduled')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('events.noEventsMessage')} {canCreate ? t('events.canSchedule') : ''}
              </p>
            </div>
          )}
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} dataTest="create-event-modal" title={t('events.createEvent')}>
        <EventForm
          onSubmit={handleCreateEvent}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {selectedDate && (
        <DayEventsModal
          isOpen={dayModalOpen}
          onClose={() => setDayModalOpen(false)}
          date={selectedDate}
          events={eventsForSelectedDay}
          currentUserId={user.id}
        />
      )}

      {selectedEvent && (
        <Modal isOpen={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)} dataTest="view-event-modal" title={selectedEvent.title}>
          <EventCard event={selectedEvent} currentUserId={user.id} />
        </Modal>
      )}
    </div>
  );
};

export default EventsPage;
