
'use client';

import React from 'react';
import type { Tenant } from '@/types';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface TenantSelectorProps {
  tenants: Tenant[];
  onSelect: (tenantId: string) => void;
  onCreateNew: () => void;
}

const TenantSelector: React.FC<TenantSelectorProps> = ({ tenants, onSelect, onCreateNew }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Select a Tenant</h2>
            <p className="mt-1 text-sm text-gray-500">Choose a temple to manage or create a new one.</p>
        </div>
        <Button onClick={onCreateNew}>
          + Create New Temple
        </Button>
      </div>
      <div className="space-y-4">
        {tenants.map((tenant: any) => {
          const safeAddress = tenant.address ?? {
            street: (tenant as any).street,
            city: (tenant as any).city,
            state: (tenant as any).state,
            country: (tenant as any).country,
            postalCode: (tenant as any).postalCode,
          };
          return (
          <div key={tenant.id} onClick={() => onSelect(tenant.id)}
             className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-amber-400 cursor-pointer transition-all">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-lg text-gray-800">{tenant.name}</h3>
                    <p className="text-sm text-gray-500">
                      {tenant.creed}
                      {safeAddress?.city || safeAddress?.state ? (
                        <>
                          {' '}· {(safeAddress?.city ?? 'Unknown City')}, {(safeAddress?.state ?? 'Unknown State')}
                        </>
                      ) : null}
                    </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {tenant.settings?.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};

export default TenantSelector;
