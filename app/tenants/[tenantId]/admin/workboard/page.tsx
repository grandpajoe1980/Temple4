'use client';

import { use } from 'react';
import AdminWorkboardPage from '@/app/components/tenant/AdminWorkboardPage';

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default function WorkboardPage({ params }: PageProps) {
  const { tenantId } = use(params);
  
  return <AdminWorkboardPage tenantId={tenantId} />;
}
