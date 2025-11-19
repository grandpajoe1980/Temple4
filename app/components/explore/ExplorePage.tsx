"use client"

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Tenant, TenantSettings, TenantBranding } from '@prisma/client';
import Input from '../ui/Input';
import Button from '../ui/Button';
import TenantCard from './TenantCard';

type TenantWithRelations = Tenant & {
  settings: TenantSettings | null;
  branding: TenantBranding | null;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
};

interface ExplorePageProps {
  initialSearchTerm: string;
  tenants: TenantWithRelations[];
  onBack?: () => void;
  onViewTenant?: (tenantId: string) => void;
}

const ExplorePage: React.FC<ExplorePageProps> = ({ initialSearchTerm, tenants, onBack, onViewTenant }) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/');
    }
  };

  const handleViewTenant = (tenantId: string) => {
    if (onViewTenant) {
      onViewTenant(tenantId);
    } else {
      router.push(`/tenants/${tenantId}`);
    }
  };

  const filteredTenants = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    if (!lowercasedTerm) {
      return tenants;
    }
    return tenants.filter(tenant => 
      tenant.name.toLowerCase().includes(lowercasedTerm) ||
      tenant.creed.toLowerCase().includes(lowercasedTerm) ||
      tenant.address.city.toLowerCase().includes(lowercasedTerm) ||
      tenant.address.state.toLowerCase().includes(lowercasedTerm) ||
      tenant.description.toLowerCase().includes(lowercasedTerm)
    );
  }, [searchTerm, tenants]);

  return (
    <div className="min-h-screen">
       <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                   <button onClick={handleBack} className="text-gray-500 hover:text-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                   </button>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L1 9l4 2.18v6.32L12 22l7-4.5V11.18L23 9l-3-1.68V5h-2v1.32L12 2zm0 16.5l-5-3.25V11.4l5 2.75v5.6zM12 12L7 9.25 12 6.5 17 9.25 12 12z"/>
                   </svg>
                  <h1 className="text-2xl font-bold text-gray-800 hidden sm:block">Explore Temples</h1>
                </div>
                <div className="flex-1 max-w-lg">
                    <Input 
                        id="explore-search"
                        label=""
                        type="search"
                        placeholder="Search by name, creed, location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        containerClassName="w-full"
                    />
                </div>
            </div>
          </div>
        </header>

        <main className="py-10">
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="px-4 sm:px-0">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {searchTerm ? `${filteredTenants.length} results found` : 'Discover Communities'}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {searchTerm ? `Showing results for "${searchTerm}"` : 'Browse all public temples on the platform.'}
                    </p>
                </div>

                {filteredTenants.length > 0 ? (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredTenants.map((tenant: any) => (
                            <TenantCard key={tenant.id} tenant={tenant} onView={() => handleViewTenant(tenant.id)} />
                        ))}
                    </div>
                ) : (
                    <div className="mt-12 text-center bg-white p-16 rounded-lg shadow-sm">
                        <h3 className="text-xl font-medium text-gray-900">No Temples Found</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Your search for "{searchTerm}" did not match any communities. Try a different search term.
                        </p>
                    </div>
                )}
            </div>
        </main>
    </div>
  );
};

export default ExplorePage;