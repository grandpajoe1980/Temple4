"use client"

import React, { useState, useEffect } from 'react';
import type { Tenant, User, EnrichedSmallGroup, EnrichedMember } from '@/types';
// Use server API routes instead of importing server-only helpers
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import SmallGroupForm from '../forms/SmallGroupForm';
import useTranslation from '@/app/hooks/useTranslation';

interface SmallGroupsTabProps {
  tenant: Tenant;
  currentUser: User;
  onRefresh: () => void;
}

const SmallGroupsTab: React.FC<SmallGroupsTabProps> = ({ tenant, currentUser, onRefresh }) => {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<EnrichedSmallGroup[]>([]);
  const [tenantMembers, setTenantMembers] = useState<EnrichedMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [groupsRes, membersRes] = await Promise.all([
          fetch(`/api/tenants/${tenant.id}/small-groups`),
          fetch(`/api/tenants/${tenant.id}/members`),
        ]);
        if (!groupsRes.ok || !membersRes.ok) throw new Error('Failed to load small groups data');
        const groupsPayload = await groupsRes.json();
        const membersPayload = await membersRes.json();
        const groupsData = Array.isArray(groupsPayload) ? groupsPayload : (groupsPayload?.groups ?? []);
        const membersData = Array.isArray(membersPayload) ? membersPayload : (membersPayload?.members ?? []);
        // Show only active groups in the admin table (archived groups are hidden)
        setGroups((groupsData as any).filter((g: any) => g.isActive !== false));
        setTenantMembers(membersData as any);
      } catch (error) {
        console.error('Failed to load small groups data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [tenant.id, onRefresh]);

  const refreshGroups = async () => {
    const res = await fetch(`/api/tenants/${tenant.id}/small-groups`);
    const payload = await res.json();
    const groupsData = Array.isArray(payload) ? payload : (payload?.groups ?? []);
    setGroups((groupsData as any).filter((g: any) => g.isActive !== false));
    onRefresh();
  };

  const handleCreateGroup = async (data: { name: string; description: string; leaderUserId: string; meetingSchedule: string; isActive: boolean; isHidden?: boolean }) => {
    await fetch(`/api/tenants/${tenant.id}/small-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refreshGroups();
    setIsModalOpen(false);
  };

  const handleUpdateGroup = async (data: { name: string; description: string; leaderUserId: string; meetingSchedule: string; isActive: boolean; isHidden?: boolean }) => {
    if (!editingGroup) return;
    await fetch(`/api/tenants/${tenant.id}/small-groups/${editingGroup.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refreshGroups();
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  const handleDeleteGroup = async () => {
    if (!editingGroup) return;
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/small-groups/${editingGroup.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        let body: any = null;
        try { body = await res.json(); } catch (_) { body = await res.text().catch(() => null); }
        const msg = body && typeof body === 'object' ? (body.message || JSON.stringify(body)) : (body || res.statusText || `HTTP ${res.status}`);
        console.error('Delete failed:', msg);
        alert(`Failed to delete group: ${msg}`);
        return;
      }
      await refreshGroups();
      setIsModalOpen(false);
      setEditingGroup(null);
    } catch (err) {
      console.error('Delete request failed', err);
      alert(t('settings.smallGroups.deleteFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.smallGroups.title')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('settings.smallGroups.description')}</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.smallGroups.title')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('settings.smallGroups.description')}</p>
        </div>
        <Button data-test="create-smallgroup-trigger" onClick={() => setIsModalOpen(true)}>{t('settings.smallGroups.createGroup')}</Button>
      </div>

      <div className="flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">{t('settings.smallGroups.groupName')}</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('settings.smallGroups.leader')}</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('settings.smallGroups.members')}</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('settings.smallGroups.status')}</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">{t('common.edit')}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {groups.map((group: any) => (
                  <tr key={group.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                      <div className="font-medium text-gray-900">{group.name}</div>
                      <div className="text-gray-500">{group.meetingSchedule}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {group.leader?.profile?.displayName ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{(group.members ?? []).length}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {
                        (() => {
                          const label = group.isHidden ? t('settings.smallGroups.hidden') : (group.isActive ? t('settings.smallGroups.active') : t('settings.smallGroups.inactive'));
                          const cls = group.isHidden ? 'bg-yellow-100 text-yellow-800' : (group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800');
                          return (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
                              {label}
                            </span>
                          );
                        })()
                      }
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <Button variant="secondary" size="sm" onClick={() => { setEditingGroup(group); setIsModalOpen(true); }}>{t('common.edit')}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingGroup(null); }} dataTest={editingGroup ? 'edit-smallgroup-modal' : 'create-smallgroup-modal'} title={editingGroup ? t('settings.smallGroups.editGroup') : t('settings.smallGroups.createGroupTitle')}>
        <SmallGroupForm
          onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup}
          onCancel={() => { setIsModalOpen(false); setEditingGroup(null); }}
          members={tenantMembers}
          initial={editingGroup ? {
            id: editingGroup.id,
            name: editingGroup.name,
            description: editingGroup.description,
            leaderUserId: editingGroup.leaderUserId || editingGroup.leader?.id,
            meetingSchedule: editingGroup.meetingSchedule,
            isActive: editingGroup.isActive,
            isHidden: editingGroup.isHidden,
          } : undefined}
          isEdit={!!editingGroup}
          onDelete={handleDeleteGroup}
        />
      </Modal>
    </div>
  );
};

export default SmallGroupsTab;
