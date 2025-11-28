import React from 'react';
import CalendarClient from '@/app/components/events/CalendarClient';

export default async function EventsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  return (
    <div className="p-6">
      <CalendarClient tenantId={tenantId} />
    </div>
  );
}
