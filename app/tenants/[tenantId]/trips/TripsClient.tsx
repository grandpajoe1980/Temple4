import TripsPage from '@/app/components/tenant/TripsPage';
import type { EnrichedTrip, Tenant, User } from '@/types';

interface TripsClientProps {
  tenant: Tenant;
  user: User & { profile: any; privacySettings: any; accountSettings: any };
  trips: EnrichedTrip[];
  isAdmin?: boolean;
}

export default function TripsClient({ tenant, user, trips, isAdmin }: TripsClientProps) {
  return (
    <TripsPage
      tenant={tenant as any}
      user={user as any}
      trips={trips as any}
      isAdmin={isAdmin}
    />
  );
}
