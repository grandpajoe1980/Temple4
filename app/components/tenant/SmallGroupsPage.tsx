"use client";

import React, { useState } from 'react';
import type { Tenant, User } from '@prisma/client';
import SmallGroupCard from './SmallGroupCard';
import SmallGroupDetail from './SmallGroupDetail';
import Button from '../ui/Button';

// Match the enriched type returned by getSmallGroupsForTenant
type EnrichedSmallGroup = {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  isPublic: boolean;
  leaderUserId: string;
  meetingSchedule: string;
  isActive: boolean;
  leader: User & {
    profile: any;
    privacySettings: any;
    accountSettings: any;
  };
  members: any[];
};

interface SmallGroupsPageProps {
  tenant: Pick<Tenant, 'id' | 'name'>;
  user: User & {
    profile: any;
    privacySettings: any;
    accountSettings: any;
  };
  groups: EnrichedSmallGroup[];
  onRefresh?: () => void;
  isAdmin?: boolean;
}

const SmallGroupsPage: React.FC<SmallGroupsPageProps> = ({ tenant, user, groups, onRefresh, isAdmin }) => {
  // Dedupe groups by id to avoid accidental duplicate rendering
  const uniqueGroupsMap: Record<string, EnrichedSmallGroup> = {};
  groups.forEach(g => { uniqueGroupsMap[g.id] = g; });
  const uniqueGroups = Object.values(uniqueGroupsMap);
  // Enforce client-side visibility: hide groups marked `isHidden` from users who
  // are neither tenant admins nor members of the group. Server routes also
  // apply this rule, but add a defensive client-side filter so hidden groups
  // cannot accidentally surface if a backend endpoint is misused.
  const visibleGroups = uniqueGroups.filter((g: any) => {
    if (!g.isHidden) return true;
    if (isAdmin) return true;
    // super-admin flag may be present on the user object in some contexts
    if ((user as any)?.isSuperAdmin) return true;
    // leader sees their own hidden group
    if (g.leaderUserId === (user as any)?.id) return true;
    // members: getSmallGroupsForTenant maps members to user objects (member.id === user.id)
    if (Array.isArray(g.members) && g.members.some((m: any) => m && m.id === (user as any)?.id)) return true;
    return false;
  });

  const activeGroups = visibleGroups.filter(g => g.isActive);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(activeGroups.length > 0 ? activeGroups[0].id : null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const name = prompt('Enter a name for the new small group');
    if (!name || name.trim().length < 3) return alert('Group name is required and must be at least 3 characters');
    try {
      setCreating(true);
      const res = await fetch(`/api/tenants/${(tenant as any).id}/small-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'Failed to create group');
      }
      if (onRefresh) onRefresh();
      alert('Group created');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Small Groups</h2>
        <p className="mt-1 text-sm text-gray-500">
          Find a group to connect with at {tenant.name}. Join to access the dedicated group chat and shared resources.
        </p>
        </div>
        <div>
          {/* Show create button to tenant admins */}
          {isAdmin && (
            <Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Creating…' : 'Create Group'}</Button>
          )}
        </div>
      </div>

      {activeGroups.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3 max-h-[70vh] overflow-y-auto space-y-4 pr-2">
            {activeGroups.map((group: any) => (
              <div key={group.id} onClick={() => setSelectedGroupId(group.id)}>
                <SmallGroupCard group={group as any} currentUser={user as any} onUpdate={onRefresh || (() => {})} onOpen={() => setSelectedGroupId(group.id)} />
              </div>
            ))}
          </div>
          <div className="lg:w-2/3 max-h-[70vh] overflow-y-auto">
            <SmallGroupDetail tenantId={(tenant as any).id} groupId={selectedGroupId} currentUser={user} onRefresh={onRefresh} onClose={() => setSelectedGroupId(null)} isAdmin={!!isAdmin} />
          </div>
        </div>
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Small Groups Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no active small groups at this time. Please check back later or contact an administrator.
          </p>
        </div>
      )}
    </div>
  );
};

export default SmallGroupsPage;
