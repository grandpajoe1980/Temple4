'use client';

import React from 'react';

export interface MemberOption {
  id: string;
  displayName: string;
  avatarUrl?: string;
  roles?: string[];
}

interface MemberSelectProps {
  members: MemberOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const STAFF_ROLES = ['ADMIN', 'LEADER', 'STAFF', 'MODERATOR'];

export default function MemberSelect({
  members,
  value,
  onChange,
  placeholder = 'Unassigned',
  className = '',
  disabled = false,
}: MemberSelectProps) {
  // Separate members into staff and regular members
  const staffMembers = members.filter((m) =>
    m.roles?.some((role) => STAFF_ROLES.includes(role))
  );
  const regularMembers = members.filter(
    (m) => !m.roles?.some((role) => STAFF_ROLES.includes(role))
  );

  // Sort each group alphabetically by display name
  staffMembers.sort((a, b) => a.displayName.localeCompare(b.displayName));
  regularMembers.sort((a, b) => a.displayName.localeCompare(b.displayName));

  const getRoleLabel = (member: MemberOption): string => {
    if (!member.roles || member.roles.length === 0) return '';
    const primaryRole = member.roles.find((r) => STAFF_ROLES.includes(r));
    if (primaryRole) {
      return ` (${primaryRole.charAt(0) + primaryRole.slice(1).toLowerCase()})`;
    }
    return '';
  };

  return (
    <select
      className={`w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      
      {staffMembers.length > 0 && (
        <optgroup label="Staff & Leadership">
          {staffMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}{getRoleLabel(member)}
            </option>
          ))}
        </optgroup>
      )}
      
      {regularMembers.length > 0 && (
        <optgroup label="Members">
          {regularMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
