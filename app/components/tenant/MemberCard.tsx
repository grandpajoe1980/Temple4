"use client"

import React from 'react';
import type { MemberWithMembership } from '@/lib/data';
import type { UserTenantRole } from '@/types';
import Card from '../ui/Card';

interface MemberCardProps {
  member: MemberWithMembership;
  onViewProfile: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onViewProfile }) => {
  const roleColors: { [key: string]: string } = {
    ADMIN: 'bg-red-100 text-red-800',
    STAFF: 'bg-sky-100 text-sky-800',
    CLERGY: 'bg-emerald-100 text-emerald-800',
    MODERATOR: 'bg-indigo-100 text-indigo-800',
    MEMBER: 'bg-gray-100 text-gray-800',
  };

  const primaryRole = member.membership.roles.find((roleInfo: UserTenantRole) => roleInfo.isPrimary) || member.membership.roles[0];
  const displayName = member.membership.displayName || member.profile?.displayName || member.email;

  return (
    <div onClick={onViewProfile} className="cursor-pointer group h-full">
      <Card className="!p-4 text-center h-full group-hover:shadow-lg group-hover:border-amber-400 border border-transparent transition-all">
        <img
          className="w-20 h-20 mx-auto rounded-full"
          src={member.profile?.avatarUrl || '/placeholder-avatar.svg'}
          alt={`${displayName}'s avatar`}
        />
        <h3 className="mt-4 text-md font-semibold text-gray-900 truncate">{displayName}</h3>
        {primaryRole?.displayTitle && (
          <p className="mt-1 text-sm text-amber-700 truncate">{primaryRole.displayTitle}</p>
        )}
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {member.membership.roles.map((roleInfo: UserTenantRole) => (
            <span
              key={roleInfo.id}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                roleColors[roleInfo.role] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {roleInfo.role}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default MemberCard;