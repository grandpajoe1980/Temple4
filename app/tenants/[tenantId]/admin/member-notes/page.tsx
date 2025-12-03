'use client';

import { use } from 'react';
import AdminMemberNotesPage from '@/app/components/tenant/AdminMemberNotesPage';

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default function MemberNotesPage({ params }: PageProps) {
  const { tenantId } = use(params);
  
  return <AdminMemberNotesPage tenantId={tenantId} />;
}
