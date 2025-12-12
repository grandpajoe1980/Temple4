"use client"

import React, { useState, useMemo, useEffect } from 'react';
import Input from '../ui/Input';
import MemberCard from './MemberCard';
import type { MemberWithMembership, TenantWithRelations, UserWithProfileSettings } from '@/lib/data';
import CommunityChips from './CommunityChips';
import { useSetPageHeader } from '../ui/PageHeaderContext';
import useTranslation from '@/app/hooks/useTranslation';

interface MembersPageProps {
  tenant: Pick<TenantWithRelations, 'name'>;
  user: UserWithProfileSettings;
  members: MemberWithMembership[];
  onViewProfile?: (userId: string) => void;
}

const MembersPage: React.FC<MembersPageProps> = ({ tenant, user: _user, members, onViewProfile }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const setPageHeader = useSetPageHeader();

  useEffect(() => {
    setPageHeader({ title: t('menu.members') });
    return () => setPageHeader(null);
  }, [setPageHeader, t]);

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
      <CommunityChips tenantId={(tenant as any).id} />

      <div className="max-w-md">
        <Input
          label={t('members.searchMembers')}
          id="member-search"
          placeholder={t('members.searchPlaceholder')}
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
          <h3 className="text-lg font-medium text-gray-900">{t('members.noMembersFound')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('members.noMembersMatch')}
          </p>
        </div>
      )}
    </div>
  );
};

export default MembersPage;