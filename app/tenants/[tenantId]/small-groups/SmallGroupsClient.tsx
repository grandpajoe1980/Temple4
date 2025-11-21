'use client';

import { useRouter } from 'next/navigation';
import SmallGroupsPage from '@/app/components/tenant/SmallGroupsPage';

interface SmallGroupsClientProps {
  tenant: any;
  user: any;
  groups: any[];
  isAdmin?: boolean;
}

export default function SmallGroupsClient({ tenant, user, groups, isAdmin }: SmallGroupsClientProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <SmallGroupsPage
      tenant={tenant}
      user={user}
      groups={groups}
      onRefresh={handleRefresh}
      isAdmin={!!isAdmin}
    />
  );
}
