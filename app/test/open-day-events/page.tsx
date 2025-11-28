"use client"

import React, { useState } from 'react';
import DayEventsModal from '../../../app/components/tenant/DayEventsModal';

export default function TestOpenDayEvents() {
  const events: any[] = [
    {
      id: 'e1',
      title: 'Test Event',
      startDateTime: new Date(),
      endDateTime: new Date(),
      locationText: 'Test Hall',
      description: 'A short test event description.',
      creatorDisplayName: 'Creator',
      creator: { id: 'u1', profile: { displayName: 'Creator' } }
    }
  ];
  const date = new Date();
  const [open, setOpen] = useState(true);

  return (
    <div>
      <DayEventsModal isOpen={open} onClose={() => setOpen(false)} date={date} events={events} currentUserId="u1" />
      <div className="p-8">
        <h1 className="text-xl font-bold">Test: Open DayEventsModal</h1>
        <p className="text-sm text-gray-500">This page exists for automated tests only.</p>
      </div>
    </div>
  );
}
