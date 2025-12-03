'use client';

import { use } from 'react';
import AdminTicketsPage from '@/app/components/tenant/AdminTicketsPage';

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default function TicketsPage({ params }: PageProps) {
  const { tenantId } = use(params);
  
  return <AdminTicketsPage tenantId={tenantId} />;
}
