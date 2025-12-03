'use client';

import { use } from 'react';
import AdminVanityDomainsPage from '@/app/components/tenant/AdminVanityDomainsPage';

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default function VanityDomainsPage({ params }: PageProps) {
  const { tenantId } = use(params);
  
  return <AdminVanityDomainsPage tenantId={tenantId} />;
}
