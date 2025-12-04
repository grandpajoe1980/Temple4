"use client"

import React from 'react';
import type { Tenant, User } from '@/types';
import { MembershipStatus, MembershipApprovalMode } from '@/types';
import type { UserTenantMembership } from '@prisma/client';
import Button from '../ui/Button';

interface PublicHeaderProps {
  tenant: Tenant;
  currentUser: User | null;
  membership: UserTenantMembership | null;
  onJoin: (tenantId: string) => void;
  onNavigateToLogin: () => void;
  onGoToDashboard: () => void;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ tenant, currentUser, membership, onJoin, onNavigateToLogin, onGoToDashboard }) => {
  const JoinButton = () => {
    if (!currentUser) {
      return <Button onClick={onNavigateToLogin}>Login to Join</Button>;
    }
    if (membership) {
      switch (membership.status) {
        case MembershipStatus.APPROVED:
          return <Button onClick={onGoToDashboard}>Go to Member Dashboard</Button>;
        case MembershipStatus.PENDING:
          return <Button disabled>Request Sent</Button>;
        case MembershipStatus.BANNED:
          return <Button disabled variant="danger">Access Restricted</Button>;
        default:
          return null; // REJECTED, etc.
      }
    }
    const buttonText = tenant.settings.membershipApprovalMode === MembershipApprovalMode.OPEN
      ? 'Join Community'
      : 'Request to Join';
    return <Button onClick={() => onJoin(tenant.id)}>{buttonText}</Button>;
  };
  
  const customLinks = tenant.branding.customLinks || [];

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="h-48 bg-gradient-to-r from-amber-100 to-amber-200">
        {tenant.branding.bannerImageUrl && (
          <img
            src={tenant.branding.bannerImageUrl}
            alt={`${tenant.name} banner`}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end space-x-5">
            <div className="flex-shrink-0">
              <img
                src={tenant.branding.logoUrl || '/placeholder-logo.svg'}
                alt={`${tenant.name} logo`}
                className="h-24 w-24 rounded-full bg-white p-1 shadow-md object-cover ring-4 ring-white -mt-16"
              />
            </div>
            <div className="mt-4 sm:mt-0">
              <h1 className="text-3xl font-bold text-gray-900 truncate">{tenant.name}</h1>
              <p className="text-md font-medium text-gray-500">{tenant.creed}</p>
              <p className="text-sm text-gray-400 mt-1">{tenant.address.city}, {tenant.address.state}</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex-shrink-0 flex items-center space-x-3">
             {customLinks.map(link => (
                 <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary">{link.label}</Button>
                 </a>
             ))}
             <JoinButton />
          </div>
        </div>
        <div className="mt-6 border-t border-gray-200 pt-4">
             <p className="text-gray-600">{tenant.description}</p>
        </div>
      </div>
    </div>
  );
};

export default PublicHeader;
