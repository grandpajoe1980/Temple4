"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import EventForm from './EventForm';

export default function NewEventClient({ tenantId }: { tenantId: string }) {
  const router = useRouter();

  return (
    <EventForm
      tenantId={tenantId}
      onCreated={(e: any) => {
        router.push(`/tenants/${tenantId}/events/${e.id}`);
      }}
    />
  );
}
