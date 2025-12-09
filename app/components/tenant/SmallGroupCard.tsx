"use client"

import React from 'react';
import type { EnrichedSmallGroup, User } from '@/types';
// Use tenant-scoped small-group APIs instead of server helpers
import Card from '../ui/Card';
import Button from '../ui/Button';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';

interface SmallGroupCardProps {
  group: EnrichedSmallGroup;
  currentUser: User;
  onUpdate: () => void;
  onOpen?: () => void;
}

const SmallGroupCard: React.FC<SmallGroupCardProps> = ({ group, currentUser, onUpdate, onOpen }) => {
  const members = Array.isArray(group.members)
    ? group.members.filter(m => m && m.user && m.user.id && m.status !== 'REJECTED' && m.status !== 'BANNED')
    : [];
  if (process.env.NODE_ENV === 'development' && Array.isArray(group.members) && group.members.length !== members.length) {
     
    console.warn('SmallGroupCard: filtered out invalid member entries for group', group.id, { originalCount: group.members.length, filteredCount: members.length });
  }
  const isUserMember = members.some(m => m.user?.id === currentUser.id && m.status === 'APPROVED');
  const isPendingMember = members.some(m => m.user?.id === currentUser.id && m.status === 'PENDING');

  const handleJoin = async () => {
    try {
      const res = await fetch(`/api/tenants/${group.tenantId}/small-groups/${group.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.status === 201) {
        // Parse created membership so we can decide whether user can view immediately
        let created: any = null;
        try { created = await res.json(); } catch (_) { created = null; }
        onUpdate();
        if (created && created.status === 'APPROVED') {
          // Open the group detail immediately so user can view without refresh
          if (onOpen) onOpen();
        } else {
          alert('Join request submitted. Waiting for leader approval.');
        }
        return;
      }
      if (res.status === 409) {
        // Already a member
        onUpdate();
        alert('You are already a member of this group.');
        return;
      }
      if (res.status === 403) {
        alert('You are not allowed to join this group.');
        return;
      }
      // try to read error message from body
      let bodyMsg = '';
      try {
        const json = await res.json();
        bodyMsg = json?.message || JSON.stringify(json);
      } catch (e) {
        bodyMsg = await res.text();
      }
      throw new Error(`Failed to join group: ${bodyMsg}`);
    } catch (err) {
      console.error(err);
      alert('Failed to join group.');
    }
  };

  const handleLeave = async () => {
    try {
      const res = await fetch(`/api/tenants/${group.tenantId}/small-groups/${group.id}/members/${currentUser.id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) throw new Error('Failed to leave group');
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Failed to leave group.');
    }
  };
  
  const ActionButton = () => {
    if (isUserMember) {
        return (
            <Button variant="secondary" onClick={handleLeave}>Leave Group</Button>
        );
    }
    if (isPendingMember) {
      return <Button variant="secondary" disabled>Request Pending</Button>
    }
    return <Button onClick={handleJoin}>Join Group</Button>
  }

  return (
    <Card className="!p-0 flex flex-col h-full">
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-semibold text-gray-900">{group.name}</h3>
        <p className="text-sm font-medium tenant-text-primary mt-1">{group.meetingSchedule}</p>
        <div className="mt-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${group.isHidden ? 'bg-yellow-100 text-yellow-800' : (group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}`}>
            {group.isHidden ? 'Hidden' : (group.isActive ? 'Active' : 'Inactive')}
          </span>
        </div>
        <p className="mt-4 text-sm text-gray-600 flex-grow">
          {group.description}
        </p>
        <div className="mt-6 border-t border-gray-200 pt-4">
             <div className="flex items-center space-x-3">
                <UserLink userId={group.leader?.id} className="flex items-center space-x-3">
                  <Avatar src={group.leader?.profile?.avatarUrl || '/placeholder-avatar.svg'} name={group.leader?.profile?.displayName || group.leader?.email || 'Leader'} size="md" className="w-10 h-10" />
                  <div>
                    <p className="text-xs text-gray-500">Leader</p>
                    <p className="text-sm font-medium text-gray-800">{group.leader?.profile?.displayName || group.leader?.email || 'Leader'}</p>
                  </div>
                </UserLink>
            </div>
        </div>
        <div className="mt-4">
            <h4 className="text-xs font-bold uppercase text-gray-500">Members ({members.length})</h4>
             <div className="flex -space-x-2 overflow-hidden mt-2">
                {members.slice(0, 7).map((m, idx) => {
                     const user = m.user;
                     return (
                       <UserLink key={user?.id ?? idx} userId={user?.id} className="inline-block" >
                         <Avatar
                           className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                           src={user?.profile?.avatarUrl || '/placeholder-avatar.svg'}
                           name={user?.profile?.displayName || user?.email || 'Group member'}
                           size="sm"
                         />
                       </UserLink>
                     );
                })}
                 {group.members.length > 7 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 ring-2 ring-white text-xs font-medium text-gray-600">
                        +{group.members.length - 7}
                    </div>
                 )}
            </div>
        </div>
      </div>
       <div className="bg-gray-50 px-6 py-4 text-right">
        <div className="flex items-center justify-end space-x-2">
          <Button variant="ghost" onClick={() => onOpen && onOpen()}>View</Button>
          <ActionButton />
        </div>
      </div>
    </Card>
  );
};

export default SmallGroupCard;
