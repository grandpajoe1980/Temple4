"use client";

import { useEffect } from 'react';
import { useSetPageHeader } from '@/app/components/ui/PageHeaderContext';
import CommunityChips from '@/app/components/tenant/CommunityChips';
import TenantWallClient from '@/app/components/tenant/TenantWallClient';
import WallCreateButton from '@/app/components/tenant/WallCreateButton';

interface WallPageClientProps {
  tenantId: string;
  userId: string;
  initialPosts: any[];
  canModerate: boolean;
}

export default function WallPageClient({ tenantId, userId, initialPosts, canModerate }: WallPageClientProps) {
  const setPageHeader = useSetPageHeader();

  useEffect(() => {
    setPageHeader({
      title: 'Wall',
      actions: <WallCreateButton userId={userId} tenantId={tenantId} />,
    });
    return () => setPageHeader(null);
  }, [userId, tenantId, setPageHeader]);

  return (
    <div className="space-y-8">
      <CommunityChips tenantId={tenantId} />
      <TenantWallClient tenantId={tenantId} initialPosts={initialPosts} showCreateButton={false} canModerate={canModerate} />
    </div>
  );
}
