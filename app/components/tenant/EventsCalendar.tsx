"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventWithCreator } from '@/types';
import DayEventsModal from './DayEventsModal';
import { CustomToolbar } from './calendar/CustomToolbar';
import { ListView } from './calendar/ListView';
import { MobileWeekView } from './calendar/MobileWeekView';

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
  
  // State for custom view management
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync focusDate prop with internal state
  useEffect(() => {
    if (focusDate) {
      setCurrentDate(focusDate);
      if (calendarRef.current) {
        calendarRef.current.getApi().gotoDate(focusDate);
      }
    }
  }, [focusDate]);

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

  // Get events for a specific date (for DayEventsModal)
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

  const handleViewChange = (view: 'month' | 'week' | 'list') => {
    setCurrentView(view);
    // Sync FullCalendar view if needed
    if (calendarRef.current) {
      const fcView = view === 'month' ? 'dayGridMonth' : 'timeGridWeek';
      calendarRef.current.getApi().changeView(fcView);
    }
  };

  const handleDateNavigate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate);
    
    if (direction === 'today') {
      const today = new Date();
      setCurrentDate(today);
      if (calendarRef.current) calendarRef.current.getApi().today();
      return;
    }

    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    
    setCurrentDate(newDate);
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(newDate);
    }
  };

  if (!mounted || isMobile === null) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden calendar-container min-h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <>
      <CustomToolbar
        date={currentDate}
        view={currentView}
        onViewChange={handleViewChange}
        onDateChange={handleDateNavigate}
        isMobile={Boolean(isMobile)}
      />

      <div className={`bg-card rounded-2xl border border-border shadow-sm overflow-visible calendar-container ${isMobile ? 'mobile-calendar' : ''}`}>
        {/* Month View (Desktop & Mobile) */}
        {currentView === 'month' && (
          <FullCalendar
            key={isMobile ? 'mobile-month' : 'desktop-month'}
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            initialDate={currentDate}
            headerToolbar={false} // Hide default toolbar
            contentHeight="auto"
            nowIndicator
            navLinks={!isMobile}
            events={calendarEvents}
            eventDisplay={isMobile ? 'list-item' : 'auto'}
            dayMaxEvents={isMobile ? 3 : true}
            dayMaxEventRows={isMobile ? false : 3}
            eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
            dateClick={(arg) => handleDateClick(arg.date)}
            eventClick={(arg) => {
              arg.jsEvent.preventDefault();
              if (isMobile) {
                if (arg.event.start) {
                  setSelectedDate(arg.event.start);
                  setIsDayModalOpen(true);
                }
              } else {
                const eventData = arg.event.extendedProps?.event as EventWithCreator | undefined;
                if (eventData && onEventClick) onEventClick(eventData);
              }
            }}
            selectable={!isMobile}
            selectMirror={!isMobile}
            firstDay={0}
            fixedWeekCount={false}
            dayHeaderFormat={isMobile ? { weekday: 'narrow' } : { weekday: 'short' }}
          />
        )}

        {/* Week View */}
        {currentView === 'week' && (
          isMobile ? (
            <MobileWeekView
              date={currentDate}
              events={events}
              onEventClick={onEventClick}
            />
          ) : (
            <FullCalendar
              key="desktop-week"
              ref={calendarRef}
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              initialDate={currentDate}
              headerToolbar={false}
              contentHeight="auto"
              nowIndicator
              events={calendarEvents}
              eventClick={(arg) => {
                arg.jsEvent.preventDefault();
                const eventData = arg.event.extendedProps?.event as EventWithCreator | undefined;
                if (eventData && onEventClick) onEventClick(eventData);
              }}
              firstDay={0}
              allDaySlot={true}
            />
          )
        )}

        {/* List View */}
        {currentView === 'list' && (
          <ListView
            events={events}
            onEventClick={onEventClick}
          />
        )}
      </div>

      {/* Day Events Modal for mobile month view */}
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
