'use client';

import { useRouter } from 'next/navigation';
import StaffPage from '@/app/components/tenant/StaffPage';
import type { MemberWithMembership, TenantWithRelations, UserWithProfileSettings } from '@/lib/data';

interface TenantStaffPageClientProps {
  tenant: TenantWithRelations;
  user: UserWithProfileSettings;
  members: MemberWithMembership[];
}

export default function TenantStaffPageClient({ tenant, user, members }: TenantStaffPageClientProps) {
  const router = useRouter();

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  return <StaffPage tenant={tenant} user={user} members={members} onViewProfile={handleViewProfile} />;

}
