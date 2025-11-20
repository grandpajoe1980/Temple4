'use client';

import { useRouter } from 'next/navigation';
import VolunteeringPage from '@/app/components/tenant/VolunteeringPage';
import type { TenantWithRelations, UserWithProfileSettings, VolunteerNeedWithSignups } from '@/lib/data';

interface VolunteeringClientProps {
  tenant: TenantWithRelations;
  user: UserWithProfileSettings;
  needs: VolunteerNeedWithSignups[];
}

export default function VolunteeringClient({ tenant, user, needs }: VolunteeringClientProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <VolunteeringPage
      tenant={tenant}
      user={user}
      needs={needs}
      onRefresh={handleRefresh}
    />
  );
}
