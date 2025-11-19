"use client"

import React, { useState, useEffect, useMemo } from 'react';
import type { Tenant, User, EnrichedMember } from '@/types';
import { getMembersForTenant } from '@/lib/data';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import EditUserProfileModal from './EditUserProfileModal';

interface UserProfilesTabProps {
  tenant: Tenant;
  currentUser: User;
  onRefresh: () => void;
}

const UserProfilesTab: React.FC<UserProfilesTabProps> = ({ tenant, currentUser, onRefresh }) => {
  const [allMembers, setAllMembers] = useState<EnrichedMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMember, setEditingMember] = useState<EnrichedMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMembers = async () => {
      setIsLoading(true);
      try {
        const members = await getMembersForTenant(tenant.id);
        setAllMembers(members as any);
      } catch (error) {
        console.error('Failed to load members:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMembers();
  }, [tenant.id, onRefresh]);

  const filteredMembers = useMemo(() => {
    if (!searchTerm) return allMembers;
    const lower = searchTerm.toLowerCase();
    return allMembers.filter(
      m => m.profile.displayName.toLowerCase().includes(lower) || m.email.toLowerCase().includes(lower)
    );
  }, [allMembers, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Manage User Profiles</h3>
          <p className="mt-1 text-sm text-gray-500">
            View member profiles for {tenant.name}.
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Manage User Profiles</h3>
        <p className="mt-1 text-sm text-gray-500">
          View member profiles for {tenant.name}. Platform Super Admins can edit profiles from this panel.
        </p>
      </div>
      
      <Input
        label="Search Members"
        id="profile-search"
        placeholder="Search by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Name</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Roles</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Edit</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredMembers.map(member => (
                  <tr key={member.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img className="h-10 w-10 rounded-full" src={member.profile.avatarUrl || '/placeholder-avatar.svg'} alt={member.profile.displayName} />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{member.profile.displayName}</div>
                          <div className="text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {member.membership.roles.map((r: any) => r.role).join(', ')}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      {currentUser.isSuperAdmin && (
                        <Button variant="secondary" size="sm" onClick={() => setEditingMember(member)}>
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingMember && (
        <EditUserProfileModal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          member={editingMember}
          adminUser={currentUser}
          onSave={() => {
            onRefresh();
            setEditingMember(null);
          }}
        />
      )}
    </div>
  );
};

export default UserProfilesTab;