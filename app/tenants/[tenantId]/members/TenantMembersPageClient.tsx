'use client';

import { useRouter } from 'next/navigation';
import MembersPage from '@/app/components/tenant/MembersPage';

type EnrichedMember = {
  id: string;
  email: string;
  password: string | null;
  isSuperAdmin: boolean;
  notificationPreferences: any;
  profile: any;
  privacySettings: any;
  accountSettings: any;
  membership: {
    id: string;
    status: any;
    displayName: string | null;
    roles: any[];
  };
};

interface TenantMembersPageClientProps {
  tenant: any;
  user: any;
  members: EnrichedMember[];
}

export default function TenantMembersPageClient({ tenant, user, members }: TenantMembersPageClientProps) {
  const router = useRouter();

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  return <MembersPage tenant={tenant} user={user} members={members} onViewProfile={handleViewProfile} />;
}
