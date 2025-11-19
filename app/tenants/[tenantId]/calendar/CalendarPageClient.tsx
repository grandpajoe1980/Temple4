'use client';

import { useState } from 'react';
import type { EventWithCreator } from '@/types';
import EventsCalendar from '@/app/components/tenant/EventsCalendar';

interface CalendarPageClientProps {
  events: EventWithCreator[];
}

export default function CalendarPageClient({ events }: CalendarPageClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // TODO: Show events for the selected date in a modal or sidebar
    console.log('Selected date:', date);
  };

  return (
    <div>
      <EventsCalendar events={events} onDateClick={handleDateClick} />
      {selectedDate && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            Selected date: {selectedDate.toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
