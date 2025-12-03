"use client"

import React from 'react';
import Link from 'next/link';

interface TripsTabProps {
  tenant: any;
  currentUser: any;
  onRefresh: () => void;
}

const TripsTab: React.FC<TripsTabProps> = ({ tenant, currentUser, onRefresh }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Trips Management</h3>
        <p className="mt-1 text-sm text-gray-500">Manage mission trips, travel groups, and itineraries.</p>
      </div>
      
      <div className="rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-gray-600 mb-4">Visit the trips page to manage your organization&apos;s trips.</p>
        <Link 
          href={`/tenants/${tenant.id}/trips`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700"
        >
          Go to Trips →
        </Link>
      </div>
    </div>
  );
};

export default TripsTab;
