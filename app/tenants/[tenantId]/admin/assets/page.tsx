'use client';

import { use } from 'react';
import AdminAssetsPage from '@/app/components/tenant/AdminAssetsPage';

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default function AssetsPage({ params }: PageProps) {
  const { tenantId } = use(params);
  
  return <AdminAssetsPage tenantId={tenantId} />;
}
