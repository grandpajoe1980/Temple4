"use client"

import React, { useState, useEffect, useMemo } from 'react';
import type { Tenant, User, Event, EventWithCreator } from '@/types';
import { getEventsForTenant, addEvent as saveEvent } from '@/lib/data';
import Button from '../ui/Button';
import EventCard from './EventCard';
import { can } from '@/lib/permissions';
import Modal from '../ui/Modal';
import EventForm from './EventForm';
import EventsCalendar from './EventsCalendar';
import DayEventsModal from './DayEventsModal';
import { useToast } from '../ui/Toast';
import { DayPicker } from 'react-day-picker';

interface EventsPageProps {
  tenant: Tenant;
  user: User;
}

type ViewMode = 'list' | 'calendar';

const EventsPage: React.FC<EventsPageProps> = ({ tenant, user }) => {
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
        const eventData = await getEventsForTenant(tenant.id);
        setEvents(eventData);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadEvents();
  }, [tenant.id]);
  
  const canCreate = (can as any)(user, tenant, 'canCreateEvents');

  const handleCreateEvent = async (eventData: Omit<Event, 'id' | 'tenantId' | 'createdByUserId'>) => {
    setIsSubmitting(true);
    try {
      await saveEvent({
        ...eventData,
        tenantId: tenant.id,
        createdByUserId: user.id,
      });
      // Reload events after creating
      const updatedEvents = await getEventsForTenant(tenant.id);
      setEvents(updatedEvents);
      setIsModalOpen(false);
      toast.success('Event created successfully!');
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('Failed to create event. Please try again.');
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Calendar & Events</h2>
            <p className="mt-1 text-sm text-gray-500">
              See what’s happening at {tenant.name}.
            </p>
          </div>
        </div>
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <p className="text-gray-500">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendar & Events</h2>
          <p className="mt-1 text-sm text-gray-500">
            See what’s happening at {tenant.name}.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-gray-200 p-1 rounded-lg flex space-x-1">
             <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-white text-gray-800 shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-300'
              }`}
            >
              Calendar
            </button>
             <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-300'
              }`}
            >
              List
            </button>
          </div>
           {canCreate && (
            <Button onClick={() => setIsModalOpen(true)}>
            + Add Event
            </Button>
           )}
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
                captionLayout="buttons"
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
            <h3 className="text-lg font-medium text-gray-900">No Events Scheduled</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no upcoming events. {canCreate ? 'You can schedule a new one.' : ''}
            </p>
          </div>
        )}
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title="Create a New Event">
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
        <Modal isOpen={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)} title={selectedEvent.title}>
          <EventCard event={selectedEvent} currentUserId={user.id} />
        </Modal>
      )}
    </div>
  );
};

export default EventsPage;
