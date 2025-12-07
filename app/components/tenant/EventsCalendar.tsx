"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventWithCreator } from '@/types';
import DayEventsModal from './DayEventsModal';

interface EventsCalendarProps {
  events: EventWithCreator[];
  onDateClick: (date: Date) => void;
  onEventClick?: (event: EventWithCreator) => void;
  focusDate?: Date | null;
  currentUserId?: string;
}

const EventsCalendar: React.FC<EventsCalendarProps> = ({ events, onDateClick, onEventClick, focusDate, currentUserId }) => {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const calendarEvents = useMemo(
    () =>
      events.map(event => ({
        id: event.id,
        title: event.title,
        start: event.startDateTime,
        end: event.endDateTime,
        allDay: Boolean((event as any).isAllDay),
        extendedProps: { event },
      })),
    [events]
  );

  // Get events for a specific date
  const getEventsForDate = (date: Date): EventWithCreator[] => {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    return events.filter(event => {
      const eventStart = new Date(event.startDateTime);
      const eventEnd = event.endDateTime ? new Date(event.endDateTime) : eventStart;
      return eventStart <= dateEnd && eventEnd >= dateStart;
    });
  };

  const handleDateClick = (date: Date) => {
    if (isMobile) {
      // On mobile month view, show day events modal
      setSelectedDate(date);
      setIsDayModalOpen(true);
    } else {
      onDateClick(date);
    }
  };

  const handleDayModalClose = () => {
    setIsDayModalOpen(false);
    setSelectedDate(null);
  };

  useEffect(() => {
    if (focusDate && calendarRef.current) {
      calendarRef.current.getApi().gotoDate(focusDate);
    }
  }, [focusDate]);

  // Don't render until we know if we're on mobile (prevents hydration mismatch)
  if (!mounted || isMobile === null) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden calendar-container min-h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  // Mobile-friendly header toolbar configuration
  const headerToolbar = isMobile
    ? {
        start: 'prev,next',
        center: 'title',
        end: 'dayGridMonth,timeGridWeek,listWeek',
      }
    : {
        start: 'prev,next today',
        center: 'title',
        end: 'dayGridMonth,timeGridWeek,listWeek',
      };

  return (
    <>
      <div className={`bg-card rounded-2xl border border-border shadow-sm overflow-visible calendar-container ${isMobile ? 'mobile-calendar' : ''}`}>
        <FullCalendar
          key={isMobile ? 'mobile' : 'desktop'}
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={headerToolbar}
          contentHeight="auto"
          nowIndicator
          navLinks={!isMobile}
          events={calendarEvents}
          // On mobile, show dots instead of full event text
          eventDisplay={isMobile ? 'list-item' : 'auto'}
          // Limit events shown per day on mobile to just show dots
          dayMaxEvents={isMobile ? 3 : true}
          dayMaxEventRows={isMobile ? false : 3}
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
          dateClick={(arg) => handleDateClick(arg.date)}
          eventClick={(arg) => {
            arg.jsEvent.preventDefault();
            if (isMobile) {
              // On mobile, clicking an event dot opens the day modal
              if (arg.event.start) {
                setSelectedDate(arg.event.start);
                setIsDayModalOpen(true);
              }
            } else {
              const eventData = arg.event.extendedProps?.event as EventWithCreator | undefined;
              if (eventData && onEventClick) {
                onEventClick(eventData);
              } else if (arg.event.start) {
                onDateClick(arg.event.start);
              }
            }
          }}
          selectable={!isMobile}
          selectMirror={!isMobile}
          expandRows={true}
          firstDay={0}
          stickyHeaderDates={true}
          handleWindowResize={true}
          fixedWeekCount={false}
          // Mobile-specific: smaller day header format
          dayHeaderFormat={isMobile ? { weekday: 'narrow' } : { weekday: 'short' }}
        />
      </div>

      {/* Day Events Modal for mobile */}
      {selectedDate && (
        <DayEventsModal
          isOpen={isDayModalOpen}
          onClose={handleDayModalClose}
          date={selectedDate}
          events={getEventsForDate(selectedDate)}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
};

export default EventsCalendar;
