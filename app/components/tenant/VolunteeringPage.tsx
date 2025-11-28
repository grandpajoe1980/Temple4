"use client";

import React, { useState } from 'react';
import type { TenantWithRelations, UserWithProfileSettings, VolunteerNeedWithSignups } from '@/lib/data';
import VolunteerNeedCard from './VolunteerNeedCard';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import VolunteerNeedForm from './forms/VolunteerNeedForm';
import CommunityChips from './CommunityChips';
import CommunityHeader from './CommunityHeader';

interface VolunteeringPageProps {
  tenant: Pick<TenantWithRelations, 'id' | 'name'>;
  user: UserWithProfileSettings;
  needs: VolunteerNeedWithSignups[];
  onRefresh?: () => void;
}

const VolunteeringPage: React.FC<VolunteeringPageProps> = ({ tenant, user, needs, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateNeed = async (data: { title: string; description: string; date: Date; slotsNeeded: number; location?: string }) => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/volunteer-needs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'Failed to create volunteer need');
      }
      setIsModalOpen(false);
      onRefresh?.();
    } catch (err: any) {
      console.error('Failed to create volunteer need', err);
      alert(err?.message || 'Failed to create volunteer need');
    }
  };

  return (
    <div className="space-y-8">
      <CommunityChips tenantId={(tenant as any).id} />
      <CommunityHeader
        title={<>Volunteer Opportunities</>}
        subtitle={<>Find ways to get involved and serve at {tenant.name}.</>}
        actions={<Button data-test="create-volunteer-trigger" onClick={() => setIsModalOpen(true)}>+ New</Button>}
      />

      {needs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {needs.map((need) => (
            <VolunteerNeedCard key={need.id} need={need} currentUser={user} onUpdate={() => onRefresh?.()} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Opportunities Available</h3>
          <p className="mt-1 text-sm text-gray-500">There are no volunteer opportunities listed at this time. Please check back later.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} dataTest="create-volunteer-modal" title="Create Volunteer Need">
        <VolunteerNeedForm onSubmit={handleCreateNeed} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default VolunteeringPage;
