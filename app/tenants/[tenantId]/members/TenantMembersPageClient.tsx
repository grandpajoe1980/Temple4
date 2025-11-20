'use client';

import { useRouter } from 'next/navigation';
import MembersPage from '@/app/components/tenant/MembersPage';
import type { MemberWithMembership, TenantWithRelations, UserWithProfileSettings } from '@/lib/data';

interface TenantMembersPageClientProps {
  tenant: TenantWithRelations;
  user: UserWithProfileSettings;
  members: MemberWithMembership[];
}

export default function TenantMembersPageClient({ tenant, user, members }: TenantMembersPageClientProps) {
  const router = useRouter();

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  return <MembersPage tenant={tenant} user={user} members={members} onViewProfile={handleViewProfile} />;
}
