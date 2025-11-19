'use client';

import { useState } from 'react';
import type { EventWithCreator } from '@/types';
import EventsCalendar from '@/app/components/tenant/EventsCalendar';
import Button from '@/app/components/ui/Button';
import Link from 'next/link';

interface CalendarPageClientProps {
  events: EventWithCreator[];
  tenantId: string;
  canCreateEvent: boolean;
}

export default function CalendarPageClient({ events, tenantId, canCreateEvent }: CalendarPageClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // TODO: Show events for the selected date in a modal or sidebar
    console.log('Selected date:', date);
  };

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
