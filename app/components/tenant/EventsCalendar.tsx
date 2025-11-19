"use client"

import React, { useEffect, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventWithCreator } from '@/types';

interface EventsCalendarProps {
  events: EventWithCreator[];
  onDateClick: (date: Date) => void;
  onEventClick?: (event: EventWithCreator) => void;
  focusDate?: Date | null;
}

const EventsCalendar: React.FC<EventsCalendarProps> = ({ events, onDateClick, onEventClick, focusDate }) => {
  const calendarRef = useRef<FullCalendar | null>(null);

  const calendarEvents = useMemo(
    () =>
      events.map(event => ({
        id: event.id,
        title: event.title,
        start: event.startDateTime,
        end: event.endDateTime,
        allDay: Boolean(event.isAllDay),
        extendedProps: { event },
      })),
    [events]
  );

  useEffect(() => {
    if (focusDate && calendarRef.current) {
      calendarRef.current.getApi().gotoDate(focusDate);
    }
  }, [focusDate]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          start: 'prev,next today',
          center: 'title',
          end: 'dayGridMonth,timeGridWeek,listWeek',
        }}
        height="auto"
        nowIndicator
        navLinks
        events={calendarEvents}
        dayMaxEventRows={3}
        eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: true }}
        dateClick={(arg) => onDateClick(arg.date)}
        eventClick={(arg) => {
          arg.jsEvent.preventDefault();
          const eventData = arg.event.extendedProps?.event as EventWithCreator | undefined;
          if (eventData && onEventClick) {
            onEventClick(eventData);
          } else if (arg.event.start) {
            onDateClick(arg.event.start);
          }
        }}
        selectable
        selectMirror
        expandRows
        firstDay={0}
      />
    </div>
  );
};

export default EventsCalendar;
