"use client"

import React, { useState, useMemo } from 'react';
import Input from '../ui/Input';
import MemberCard from './MemberCard';
import type { MemberWithMembership, TenantWithRelations, UserWithProfileSettings } from '@/lib/data';
import CommunityChips from './CommunityChips';

interface StaffPageProps {
  tenant: Pick<TenantWithRelations, 'name'>;
  user: UserWithProfileSettings;
  members: MemberWithMembership[];
  onViewProfile?: (userId: string) => void;
}

const StaffPage: React.FC<StaffPageProps> = ({ tenant, user: _user, members, onViewProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = useMemo(() => {
    if (!searchTerm) return members;
    return members.filter(
      (member) =>
        (member.membership.displayName || member.profile?.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [members, searchTerm]);

  return (
    <div className="space-y-8">
      <CommunityChips tenantId={(tenant as any).id} />
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Staff Directory</h2>
        <p className="mt-1 text-sm text-gray-500">Meet the staff of {tenant.name}.</p>
      </div>

      <div className="max-w-md">
        <Input
          label="Search Staff"
          id="staff-search"
          placeholder="Search staff by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMembers.map((member) => (
            <MemberCard key={member.id} member={member} onViewProfile={() => onViewProfile?.(member.id)} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Staff Found</h3>
          <p className="mt-1 text-sm text-gray-500">No staff members match your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
