import React from 'react';
import NewEventClient from '@/app/components/events/NewEventClient';

export default async function NewEventPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Create New Event</h2>
      <div className="max-w-2xl">
        <NewEventClient tenantId={tenantId} />
      </div>
    </div>
  );
}
