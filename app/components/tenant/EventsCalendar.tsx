"use client";

import React, { useState } from 'react';
import type { EventWithCreator } from '@/types';

interface EventsCalendarProps {
  events: EventWithCreator[];
  onDateClick: (date: Date) => void;
}

const EventsCalendar: React.FC<EventsCalendarProps> = ({ events, onDateClick }) => {
  const [viewDate, setViewDate] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const eventsByDate: { [key: string]: EventWithCreator[] } = {};
  events.forEach(event => {
    const dateKey = new Date(event.startDateTime).toDateString();
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="font-semibold text-gray-800 text-lg">
          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <button type="button" onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-7 text-center text-xs text-gray-500 font-semibold border-b border-gray-200 pb-2 mb-2">
        {weekdays.map(day => <div key={day}>{day}</div>)}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-start-${i}`} className="border-r border-b border-gray-100 h-28"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
          const dateKey = date.toDateString();
          const isToday = date.toDateString() === today.toDateString();
          const dayEvents = eventsByDate[dateKey] || [];

          return (
            <div 
              key={day} 
              className="border-r border-b border-gray-100 h-28 p-1.5 cursor-pointer hover:bg-amber-50 transition-colors"
              onClick={() => onDateClick(date)}
            >
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${isToday ? 'bg-amber-600 text-white font-bold' : 'text-gray-700'}`}>
                {day}
              </div>
              <div className="mt-1 space-y-1 overflow-y-auto max-h-16">
                {dayEvents.map((event: any) => (
                  <div key={event.id} className="text-xs bg-blue-100 text-blue-800 p-1 rounded truncate">
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
         {Array.from({ length: 42 - daysInMonth - startDay }).map((_, i) => (
          <div key={`empty-end-${i}`} className="border-r border-b border-gray-100 h-28"></div>
        ))}
      </div>
    </div>
  );
};

export default EventsCalendar;
