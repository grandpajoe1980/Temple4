import React from 'react';
import type { Tenant, TenantSettings, TenantBranding } from '@prisma/client';
import Card from '../ui/Card';
import Button from '../ui/Button';

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

interface TenantCardProps {
  tenant: TenantWithRelations;
  onView: () => void;
}

const TenantCard: React.FC<TenantCardProps> = ({ tenant, onView }) => {
  return (
    <div className="h-full">
        <Card className="!p-0 flex flex-col h-full group">
            <div className="relative">
                <img 
                    src={tenant.branding?.bannerImageUrl || `https://source.unsplash.com/random/400x200?temple,${tenant.id}`} 
                    alt={`${tenant.name} banner`} 
                    className="h-40 w-full object-cover" 
                />
                <div className="absolute -bottom-8 left-6">
                    <img 
                        src={tenant.branding?.logoUrl || `https://source.unsplash.com/random/100x100?logo,${tenant.id}`}
                        alt={`${tenant.name} logo`}
                        className="h-16 w-16 rounded-full bg-white p-1 shadow-md object-cover ring-2 ring-white"
                    />
                </div>
            </div>

            <div className="p-6 pt-10 flex-grow">
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-amber-700 transition-colors">{tenant.name}</h3>
                <p className="text-sm font-medium text-amber-600">{tenant.creed}</p>
                <p className="mt-1 text-sm text-gray-500">
                    {tenant.address.city}, {tenant.address.state}
                </p>
                <p className="mt-4 text-sm text-gray-600 line-clamp-3 flex-grow">
                    {tenant.description}
                </p>
            </div>
            
            <div className="p-6 pt-2">
                <Button onClick={onView} className="w-full">View</Button>
            </div>
        </Card>
    </div>
  );
};

export default TenantCard;