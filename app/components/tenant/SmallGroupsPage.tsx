"use client";

import React from 'react';
import type { Tenant, User } from '@/types';
import { SmallGroup } from '@prisma/client';
import SmallGroupCard from './SmallGroupCard';

interface SmallGroupsPageProps {
  tenant: Tenant;
  user: User;
  groups: SmallGroup[];
  onRefresh: () => void;
}

const SmallGroupsPage: React.FC<SmallGroupsPageProps> = ({ tenant, user, groups, onRefresh }) => {
  const activeGroups = groups.filter(g => g.isActive);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Small Groups</h2>
        <p className="mt-1 text-sm text-gray-500">
          Find a group to connect with at {tenant.name}.
        </p>
      </div>

      {activeGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeGroups.map((group) => (
            <SmallGroupCard key={group.id} group={group} currentUser={user} onUpdate={onRefresh} />
          ))}
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
