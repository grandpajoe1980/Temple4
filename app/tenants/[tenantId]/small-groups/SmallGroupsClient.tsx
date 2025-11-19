'use client';

import { useRouter } from 'next/navigation';
import SmallGroupsPage from '@/app/components/tenant/SmallGroupsPage';

interface SmallGroupsClientProps {
  tenant: any;
  user: any;
  groups: any[];
}

export default function SmallGroupsClient({ tenant, user, groups }: SmallGroupsClientProps) {
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
    />
  );
}
