import React from 'react';
import EditEventClient from '@/app/components/events/EditEventClient';
import { getEventById } from '@/lib/services/event-service';
import { notFound } from 'next/navigation';

export default async function EditEventPage({ params }: { params: Promise<{ tenantId: string; eventId: string }> }) {
  const { tenantId, eventId } = await params;
  const ev = await getEventById(tenantId, eventId);
  if (!ev) return notFound();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Edit Event</h2>
      <div className="max-w-2xl">
        <EditEventClient tenantId={tenantId} event={ev} />
      </div>
    </div>
  );
}
