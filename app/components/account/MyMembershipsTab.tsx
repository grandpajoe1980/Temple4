'use client';

import React, { useState, useMemo } from 'react';
import type { User, UserTenantMembership, Tenant } from '@/types';
import { getEnrichedMembershipsForUser } from '@/lib/data';
import Button from '../ui/Button';
import EditMembershipModal from './EditMembershipModal';

interface MyMembershipsTabProps {
  user: User;
  onRefresh: () => void;
}

type EnrichedMembership = {
    membership: UserTenantMembership;
    tenant: Tenant;
}

const MyMembershipsTab: React.FC<MyMembershipsTabProps> = ({ user, onRefresh }) => {
  const memberships = useMemo(() => getEnrichedMembershipsForUser(user.id), [user.id, onRefresh]);
  const [editingMembership, setEditingMembership] = useState<EnrichedMembership | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">My Memberships</h3>
        <p className="mt-1 text-sm text-gray-500">Manage your identity within each community you've joined.</p>
      </div>
      
      {memberships.length > 0 ? (
        <div className="flow-root">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Tenant</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">My Display Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">My Title</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Edit</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {memberships.map(({ membership, tenant }) => {
                    const primaryRole = membership.roles.find(r => r.isPrimary) || membership.roles[0];
                    return (
                        <tr key={membership.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                                <div className="font-medium text-gray-900">{tenant.name}</div>
                                <div className="text-gray-500">{tenant.creed}</div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {membership.displayName || `${user.profile.displayName} (Global)`}
                            </td>
                             <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {primaryRole?.displayTitle || 'Not set'}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                <Button variant="secondary" size="sm" onClick={() => setEditingMembership({ membership, tenant })}>
                                    Edit
                                </Button>
                            </td>
                        </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No Memberships</h3>
            <p className="mt-1 text-sm text-gray-500">You haven't joined any tenants yet.</p>
        </div>
      )}

      {editingMembership && (
        <EditMembershipModal
          isOpen={!!editingMembership}
          onClose={() => setEditingMembership(null)}
          user={user}
          enrichedMembership={editingMembership}
          onSave={() => {
            onRefresh();
            setEditingMembership(null);
          }}
        />
      )}
    </div>
  );
};

export default MyMembershipsTab;