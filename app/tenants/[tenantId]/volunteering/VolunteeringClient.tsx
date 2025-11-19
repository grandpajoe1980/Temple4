'use client';

import { useRouter } from 'next/navigation';
import VolunteeringPage from '@/app/components/tenant/VolunteeringPage';

interface VolunteeringClientProps {
  tenant: any;
  user: any;
  needs: any[];
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
