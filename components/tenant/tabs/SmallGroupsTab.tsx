import React, { useState, useMemo } from 'react';
import type { Tenant, User, EnrichedSmallGroup } from '../../../types';
import { getSmallGroupsForTenant, createSmallGroup, getMembersForTenant } from '../../../seed-data';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import SmallGroupForm from '../forms/SmallGroupForm';

interface SmallGroupsTabProps {
  tenant: Tenant;
  currentUser: User;
  onRefresh: () => void;
}

const SmallGroupsTab: React.FC<SmallGroupsTabProps> = ({ tenant, currentUser, onRefresh }) => {
  const [groups, setGroups] = useState<EnrichedSmallGroup[]>(() => getSmallGroupsForTenant(tenant.id));
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const tenantMembers = useMemo(() => getMembersForTenant(tenant.id), [tenant.id]);

  const refreshGroups = () => {
    setGroups(getSmallGroupsForTenant(tenant.id));
    onRefresh();
  };

  const handleCreateGroup = (data: { name: string; description: string; leaderUserId: string; meetingSchedule: string; isActive: boolean }) => {
    createSmallGroup({ tenantId: tenant.id, ...data }, currentUser.id);
    refreshGroups();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Small Group Management</h3>
          <p className="mt-1 text-sm text-gray-500">Create and manage small groups for your members.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Create Group</Button>
      </div>
      
       <div className="flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Group Name</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Leader</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Members</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                      <div className="font-medium text-gray-900">{group.name}</div>
                      <div className="text-gray-500">{group.meetingSchedule}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {group.leader.profile.displayName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{group.members.length}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                       <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {group.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                       <Button variant="secondary" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Small Group">
        <SmallGroupForm
          onSubmit={handleCreateGroup}
          onCancel={() => setIsModalOpen(false)}
          members={tenantMembers}
        />
      </Modal>
    </div>
  );
};

export default SmallGroupsTab;
