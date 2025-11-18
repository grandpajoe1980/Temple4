"use client";

import React, { useState, useMemo } from 'react';
import Input from '../ui/Input';
import MemberCard from './MemberCard';

// Enriched member type from getMembersForTenant
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

interface MembersPageProps {
  tenant: any;
  user: any;
  members: EnrichedMember[];
  onViewProfile?: (userId: string) => void;
}

const MembersPage: React.FC<MembersPageProps> = ({ tenant, user, members, onViewProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = useMemo(() => {
    if (!searchTerm) {
      return members;
    }
    return members.filter(
      (member) =>
        (member.membership.displayName || member.profile?.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [members, searchTerm]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Member Directory</h2>
        <p className="mt-1 text-sm text-gray-500">
          Find and connect with members of {tenant.name}.
        </p>
      </div>

      <div className="max-w-md">
        <Input
          label="Search Members"
          id="member-search"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMembers.map((member) => (
            <MemberCard key={member.id} member={member as any} onViewProfile={() => onViewProfile?.(member.id)} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Members Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No members match your search criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default MembersPage;