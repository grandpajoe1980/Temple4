"use client"

import React, { useState, useEffect } from 'react';
import type { Tenant, User, EnrichedMember, UserTenantRole } from '@/types';
import { MembershipApprovalMode, MembershipStatus, OnboardingStatus } from '@/types';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';
// Use server API routes from client components instead of importing server-only Prisma helpers
// Permissions are fetched from the server via the tenant context endpoint
import EditRolesModal from './EditRolesModal';
import Modal from '../../ui/Modal';

interface MembershipTabProps {
  tenant: Tenant;
  onUpdate: (tenant: Tenant) => void;
  onSave: (updates: any) => Promise<any>;
  currentUser: User;
  onImpersonate: (user: User) => void;
  onRefresh: () => void;
}

// Helper to get onboarding status display
const getOnboardingStatusBadge = (status?: OnboardingStatus | string) => {
  if (!status) return null;
  
  const statusConfig: Record<string, { label: string; className: string }> = {
    [OnboardingStatus.PENDING]: { label: 'Pending', className: 'bg-gray-100 text-gray-700' },
    [OnboardingStatus.PACKET_QUEUED]: { label: 'Packet Queued', className: 'bg-yellow-100 text-yellow-700' },
    [OnboardingStatus.PACKET_SENT]: { label: 'Packet Sent', className: 'bg-blue-100 text-blue-700' },
    [OnboardingStatus.COMPLETED]: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  };
  
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const MembershipTab: React.FC<MembershipTabProps> = ({ tenant, onUpdate, onSave, currentUser, onImpersonate, onRefresh }) => {
  const [allMembers, setAllMembers] = useState<EnrichedMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<EnrichedMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      setIsLoading(true);
      try {
        // Request all members (large limit) to ensure pending requests are included
        const res = await fetch(`/api/tenants/${tenant.id}/members?limit=1000`);
        if (!res.ok) throw new Error('Failed to load members');
        const payload = await res.json();
        // API may return either an array or an object { members, pagination }
        const members = Array.isArray(payload) ? payload : (payload?.members ?? []);
        setAllMembers(members as any);
      } catch (error) {
        console.error('Failed to load members:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMembers();
  }, [tenant.id, onRefresh]);

  const [permissions, setPermissions] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/me`, { cache: 'no-store' });
        if (!res.ok) {
          setPermissions(null);
          return;
        }
        const data = await res.json();
        setPermissions(data.permissions ?? null);
      } catch (err) {
        console.error('Failed to load tenant permissions', err);
        setPermissions(null);
      }
    };
    fetchPermissions();
  }, [tenant.id]);

  const canApprove = Boolean(permissions?.canApproveMembership);
  const canBan = Boolean(permissions?.canBanMembers);

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({
      ...tenant,
      settings: {
        ...tenant.settings,
        membershipApprovalMode: e.target.value as MembershipApprovalMode,
      },
    });
  };

  const handleWelcomePacketChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      ...tenant,
      settings: {
        ...tenant.settings,
        welcomePacketUrl: e.target.value || null,
      },
    });
  };

  const handleStatusUpdate = async (membershipId: string, status: MembershipStatus, memberName: string) => {
    let confirmMessage = `Are you sure you want to ${status.toLowerCase()} this member?`;
    if (status === MembershipStatus.BANNED) {
        confirmMessage = `Are you sure you want to ban ${memberName}? This will revoke all their permissions and access to this tenant's member-only content.`;
    } else if (status === MembershipStatus.APPROVED && allMembers.find(m => m.membership.id === membershipId)?.membership.status === MembershipStatus.BANNED) {
        confirmMessage = `Are you sure you want to unban ${memberName}? This will restore their previous roles and permissions.`;
    } else if (status === MembershipStatus.APPROVED) {
        confirmMessage = `Are you sure you want to approve ${memberName}'s request to join?`;
    }

    if (window.confirm(confirmMessage)) {
      await fetch(`/api/tenants/${tenant.id}/members/${membershipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      onRefresh();
    }
  };
  
  const handleRolesUpdate = async (member: EnrichedMember, newRoles: UserTenantRole[]) => {
    // Existing server route expects an array of role names (TenantRole)
    await fetch(`/api/tenants/${tenant.id}/members/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: newRoles.map(r => r.role) }),
    });
    setEditingMember(null);
    onRefresh();
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Membership & Moderation</h3>
          <p className="mt-1 text-sm text-gray-500">Manage member access and permissions for your tenant.</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading members...</p>
        </div>
      </div>
    );
  }

  const requested = allMembers.filter(m => m.membership?.status === MembershipStatus.PENDING);
  const approved = allMembers.filter(m => m.membership?.status === MembershipStatus.APPROVED);
  const banned = allMembers.filter(m => m.membership?.status === MembershipStatus.BANNED);

  const MemberTable = ({ members, title, showOnboarding = false }: { members: EnrichedMember[]; title: string; showOnboarding?: boolean }) => {
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
                    {showOnboarding && (
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Onboarding</th>
                    )}
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {members.map((member: any) => {
                    const primaryRole = member.membership.roles.find((r: any) => r.isPrimary) || member.membership.roles[0];
                    return (
                      <tr key={member.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <UserLink userId={member.id}>
                                <Avatar src={member.profile?.avatarUrl || '/placeholder-avatar.svg'} name={member.profile?.displayName || member.email} size="md" />
                              </UserLink>
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">
                                <UserLink userId={member.id} className="inline-block">
                                  {member.profile?.displayName}
                                </UserLink>
                              </div>
                              <div className="text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="text-gray-900">{primaryRole?.displayTitle}</div>
                          <div className="text-gray-500">{member.membership.roles.map((r: any) => r.role).join(', ')}</div>
                        </td>
                        {showOnboarding && (
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {getOnboardingStatusBadge(member.membership.onboardingStatus)}
                          </td>
                        )}
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                           <div className="flex items-center justify-end space-x-2">
                             {member.membership.status === MembershipStatus.PENDING && canApprove && (
                                <>
                                  <Button variant="secondary" size="sm" onClick={() => handleStatusUpdate(member.id, MembershipStatus.REJECTED, member.profile?.displayName)}>Reject</Button>
                                  <Button size="sm" onClick={() => handleStatusUpdate(member.id, MembershipStatus.APPROVED, member.profile?.displayName)}>Approve</Button>
                                </>
                             )}
                              {member.membership.status === MembershipStatus.APPROVED && canApprove && (
                                <Button data-test={`edit-roles-trigger-${member.id}`} variant="secondary" size="sm" onClick={() => setEditingMember(member)}>Edit Roles</Button>
                              )}
                             {member.membership.status === MembershipStatus.APPROVED && canBan && (
                                <Button variant="danger" size="sm" onClick={() => handleStatusUpdate(member.id, MembershipStatus.BANNED, member.profile?.displayName)}>Ban</Button>
                             )}
                              {member.membership.status === MembershipStatus.BANNED && canBan && (
                                <Button variant="secondary" size="sm" onClick={() => handleStatusUpdate(member.id, MembershipStatus.APPROVED, member.profile?.displayName)}>Unban</Button>
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
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] sm:text-sm rounded-md bg-white text-gray-900"
          value={tenant.settings.membershipApprovalMode}
          onChange={handleModeChange}
        >
          <option value={MembershipApprovalMode.OPEN}>Open Enrollment (anyone can join instantly)</option>
          <option value={MembershipApprovalMode.APPROVAL_REQUIRED}>Approval Required (admins must approve requests)</option>
        </select>
      </div>

      {/* Welcome Packet Settings */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Welcome Packet</h4>
        <p className="text-sm text-gray-500 mb-4">
          Configure a welcome packet that new members will receive when their membership is approved.
        </p>
        <Input
          label="Welcome Packet URL"
          id="welcomePacketUrl"
          name="welcomePacketUrl"
          type="url"
          value={tenant.settings.welcomePacketUrl || ''}
          onChange={handleWelcomePacketChange}
          placeholder="https://example.com/welcome-packet.pdf"
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter a URL to a PDF, Google Doc, or webpage that new members should receive when approved.
          Leave empty to skip sending a welcome packet.
        </p>
      </div>

      <div className="border-t border-gray-200 pt-8 space-y-8">
        <MemberTable members={requested} title="Pending Requests" />
        <MemberTable members={approved} title="Approved Members" showOnboarding={true} />
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
        <Button
          disabled={isSaving}
          onClick={async () => {
            try {
              setIsSaving(true);
              await onSave({ settings: { ...tenant.settings } });
              alert('Membership settings saved');
            } catch (error: any) {
              alert(error.message || 'Failed to save membership settings');
            } finally {
              setIsSaving(false);
            }
          }}
        >
          {isSaving ? 'Saving...' : 'Save Membership Settings'}
        </Button>
      </div>
    </div>
  );
};

export default MembershipTab;
