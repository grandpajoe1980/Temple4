"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import EventForm from './EventForm';

export default function EditEventClient({ tenantId, event }: { tenantId: string; event: any }) {
  const router = useRouter();

  return (
    <EventForm
      tenantId={tenantId}
      event={event}
      onSaved={(e: any) => {
        router.push(`/tenants/${tenantId}/events/${e.id}`);
      }}
    />
  );
}
