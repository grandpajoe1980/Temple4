import React, { useState, useMemo } from 'react';
import type { Tenant, User } from '../../types';
import { getVolunteerNeedsForTenant } from '../../seed-data';
import VolunteerNeedCard from './VolunteerNeedCard';

interface VolunteeringPageProps {
  tenant: Tenant;
  user: User;
  onRefresh: () => void;
}

const VolunteeringPage: React.FC<VolunteeringPageProps> = ({ tenant, user, onRefresh }) => {
  const needs = useMemo(() => getVolunteerNeedsForTenant(tenant.id), [tenant.id, onRefresh]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Volunteer Opportunities</h2>
        <p className="mt-1 text-sm text-gray-500">
          Find ways to get involved and serve at {tenant.name}.
        </p>
      </div>

      {needs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {needs.map((need) => (
            <VolunteerNeedCard key={need.id} need={need} currentUser={user} onUpdate={onRefresh} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Opportunities Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no volunteer opportunities listed at this time. Please check back later.
          </p>
        </div>
      )}
    </div>
  );
};

export default VolunteeringPage;
