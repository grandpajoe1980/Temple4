"use client"

import React from 'react';
import type { EnrichedSmallGroup, User } from '@/types';
import { joinSmallGroup, leaveSmallGroup } from '@/lib/data';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface SmallGroupCardProps {
  group: EnrichedSmallGroup;
  currentUser: User;
  onUpdate: () => void;
}

const SmallGroupCard: React.FC<SmallGroupCardProps> = ({ group, currentUser, onUpdate }) => {
  const members = Array.isArray(group.members) ? group.members.filter(m => m && m.user && m.user.id) : [];
  if (process.env.NODE_ENV === 'development' && Array.isArray(group.members) && group.members.length !== members.length) {
    // eslint-disable-next-line no-console
    console.warn('SmallGroupCard: filtered out invalid member entries for group', group.id, { originalCount: group.members.length, filteredCount: members.length });
  }
  const isUserMember = members.some(m => m.user?.id === currentUser.id);

  const handleJoin = async () => {
    await joinSmallGroup(group.id, currentUser.id);
    onUpdate();
  };

  const handleLeave = async () => {
    await leaveSmallGroup(group.id, currentUser.id);
    onUpdate();
  };
  
  const ActionButton = () => {
    if (isUserMember) {
        return (
            <Button variant="secondary" onClick={handleLeave}>Leave Group</Button>
        );
    }
    return <Button onClick={handleJoin}>Join Group</Button>
  }

  return (
    <Card className="!p-0 flex flex-col h-full">
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-semibold text-gray-900">{group.name}</h3>
        <p className="text-sm font-medium text-amber-600 mt-1">{group.meetingSchedule}</p>
        <p className="mt-4 text-sm text-gray-600 flex-grow">
          {group.description}
        </p>
        <div className="mt-6 border-t border-gray-200 pt-4">
             <div className="flex items-center space-x-3">
                <img
                  src={group.leader?.profile?.avatarUrl || '/placeholder-avatar.svg'}
                  alt={group.leader?.profile?.displayName || group.leader?.email || 'Group leader'}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                    <p className="text-xs text-gray-500">Leader</p>
                    <p className="text-sm font-medium text-gray-800">{group.leader.profile?.displayName || group.leader.email || 'Leader'}</p>
                </div>
            </div>
        </div>
        <div className="mt-4">
            <h4 className="text-xs font-bold uppercase text-gray-500">Members ({members.length})</h4>
             <div className="flex -space-x-2 overflow-hidden mt-2">
                {members.slice(0, 7).map((m, idx) => {
                     const user = m.user;
                     return (
                       <img
                         key={user?.id ?? idx}
                         className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                         src={user?.profile?.avatarUrl || '/placeholder-avatar.svg'}
                         alt={user?.profile?.displayName || user?.email || 'Group member'}
                         title={user?.profile?.displayName || user?.email || 'Group member'}
                       />
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
        <ActionButton />
      </div>
    </Card>
  );
};

export default SmallGroupCard;
