import React, { useState, useMemo } from 'react';
import type { Tenant, User, EnrichedMember, UserTenantRole } from '@/types';
import { MembershipApprovalMode, MembershipStatus } from '@/types';
import Button from '../../ui/Button';
import { getMembersForTenant, updateMembershipStatus, updateMemberRolesAndTitle } from '@/lib/data';
import { can } from '@/lib/permissions';
import EditRolesModal from './EditRolesModal';
import Modal from '../../ui/Modal';

interface MembershipTabProps {
  tenant: Tenant;
  onUpdate: (tenant: Tenant) => void;
  currentUser: User;
  onImpersonate: (user: User) => void;
  onRefresh: () => void;
}

const MembershipTab: React.FC<MembershipTabProps> = ({ tenant, onUpdate, currentUser, onImpersonate, onRefresh }) => {
  const allMembers = getMembersForTenant(tenant.id);
  
  const [editingMember, setEditingMember] = useState<EnrichedMember | null>(null);

  const canApprove = can(currentUser, tenant, 'canApproveMembership');
  const canBan = can(currentUser, tenant, 'canBanMembers');

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({
      ...tenant,
      settings: {
        ...tenant.settings,
        membershipApprovalMode: e.target.value as MembershipApprovalMode,
      },
    });
  };

  const handleStatusUpdate = (membershipId: string, status: MembershipStatus, memberName: string) => {
    let confirmMessage = `Are you sure you want to ${status.toLowerCase()} this member?`;
    if (status === MembershipStatus.BANNED) {
        confirmMessage = `Are you sure you want to ban ${memberName}? This will revoke all their permissions and access to this tenant's member-only content.`;
    } else if (status === MembershipStatus.APPROVED && allMembers.find(m => m.membership.id === membershipId)?.membership.status === MembershipStatus.BANNED) {
        confirmMessage = `Are you sure you want to unban ${memberName}? This will restore their previous roles and permissions.`;
    } else if (status === MembershipStatus.APPROVED) {
        confirmMessage = `Are you sure you want to approve ${memberName}'s request to join?`;
    }

    if (window.confirm(confirmMessage)) {
      updateMembershipStatus(membershipId, status, currentUser.id);
      onRefresh();
    }
  };
  
  const handleRolesUpdate = (member: EnrichedMember, newRoles: UserTenantRole[]) => {
    updateMemberRolesAndTitle(member.membership.id, newRoles, currentUser.id);
    setEditingMember(null);
    onRefresh();
  };

  const requested = allMembers.filter(m => m.membership.status === MembershipStatus.PENDING);
  const approved = allMembers.filter(m => m.membership.status === MembershipStatus.APPROVED);
  const banned = allMembers.filter(m => m.membership.status === MembershipStatus.BANNED);

  const MemberTable = ({ members, title }: { members: EnrichedMember[]; title: string }) => {
    if (members.length === 0) {
      return (
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">No members in this category.</p>
        </div>
      );
    }
    return (
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
        <div className="mt-4 flow-root">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Title / Roles</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {members.map((member) => {
                    const primaryRole = member.membership.roles.find(r => r.isPrimary) || member.membership.roles[0];
                    return (
                      <tr key={member.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img className="h-10 w-10 rounded-full" src={member.profile.avatarUrl} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{member.profile.displayName}</div>
                              <div className="text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="text-gray-900">{primaryRole?.displayTitle}</div>
                          <div className="text-gray-500">{member.membership.roles.map(r => r.role).join(', ')}</div>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                           <div className="flex items-center justify-end space-x-2">
                             {member.membership.status === MembershipStatus.PENDING && canApprove && (
                                <>
                                  <Button variant="secondary" size="sm" onClick={() => handleStatusUpdate(member.membership.id, MembershipStatus.REJECTED, member.profile.displayName)}>Reject</Button>
                                  <Button size="sm" onClick={() => handleStatusUpdate(member.membership.id, MembershipStatus.APPROVED, member.profile.displayName)}>Approve</Button>
                                </>
                             )}
                              {member.membership.status === MembershipStatus.APPROVED && canApprove && (
                                <Button variant="secondary" size="sm" onClick={() => setEditingMember(member)}>Edit Roles</Button>
                              )}
                             {member.membership.status === MembershipStatus.APPROVED && canBan && (
                                <Button variant="danger" size="sm" onClick={() => handleStatusUpdate(member.membership.id, MembershipStatus.BANNED, member.profile.displayName)}>Ban</Button>
                             )}
                              {member.membership.status === MembershipStatus.BANNED && canBan && (
                                <Button variant="secondary" size="sm" onClick={() => handleStatusUpdate(member.membership.id, MembershipStatus.APPROVED, member.profile.displayName)}>Unban</Button>
                             )}
                             {currentUser.isSuperAdmin && currentUser.id !== member.id && (
                               <Button variant="secondary" size="sm" onClick={() => onImpersonate(member)}>Impersonate</Button>
                            )}
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Membership Settings</h3>
        <p className="mt-1 text-sm text-gray-500">Configure how users can join your temple.</p>
      </div>
      <div>
        <label htmlFor="membershipApprovalMode" className="block text-sm font-medium text-gray-700">
          Membership Approval Mode
        </label>
        <select
          id="membershipApprovalMode"
          name="membershipApprovalMode"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md bg-white text-gray-900"
          value={tenant.settings.membershipApprovalMode}
          onChange={handleModeChange}
        >
          <option value={MembershipApprovalMode.OPEN}>Open Enrollment (anyone can join instantly)</option>
          <option value={MembershipApprovalMode.APPROVAL_REQUIRED}>Approval Required (admins must approve requests)</option>
        </select>
      </div>
      <div className="border-t border-gray-200 pt-8 space-y-8">
        <MemberTable members={requested} title="Pending Requests" />
        <MemberTable members={approved} title="Approved Members" />
        <MemberTable members={banned} title="Banned Members" />
      </div>

       {editingMember && (
         <EditRolesModal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          member={editingMember}
          onSubmit={handleRolesUpdate}
         />
       )}

      <div className="text-right border-t border-gray-200 pt-6">
        <Button onClick={() => alert('Membership settings saved (mock)!')}>Save Membership Settings</Button>
      </div>
    </div>
  );
};

export default MembershipTab;
