"use client"

import React, { useState, useEffect } from 'react';
import type { Tenant, User, EnrichedVolunteerNeed } from '@/types';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import VolunteerNeedForm from '../forms/VolunteerNeedForm';

interface VolunteeringTabProps {
  tenant: Tenant;
  currentUser: User;
  onRefresh: () => void;
}

const VolunteeringTab: React.FC<VolunteeringTabProps> = ({ tenant, currentUser, onRefresh }) => {
  const [needs, setNeeds] = useState<EnrichedVolunteerNeed[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedNeedId, setExpandedNeedId] = useState<string | null>(null);

  useEffect(() => {
    const loadNeeds = async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/volunteer-needs`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load volunteer needs');
        const data = await res.json();
        setNeeds(data as any);
      } catch (err) {
        console.error('Failed to load volunteer needs', err);
        setNeeds([]);
      }
    };
    loadNeeds();
  }, [tenant.id]);

  const refreshNeeds = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/volunteer-needs`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load volunteer needs');
      const data = await res.json();
      setNeeds(data as any);
    } catch (err) {
      console.error('Failed to load volunteer needs', err);
      setNeeds([]);
    }
    onRefresh();
  };

  const handleCreateNeed = async (data: { title: string; description: string; date: Date; slotsNeeded: number }) => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/volunteer-needs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create volunteer need');
      await refreshNeeds();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create volunteer need', err);
      alert('Failed to create volunteer need');
    }
  };

  const toggleExpand = (needId: string) => {
    setExpandedNeedId(prev => (prev === needId ? null : needId));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Volunteer Management</h3>
          <p className="mt-1 text-sm text-gray-500">Create and manage volunteer opportunities for your members.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Create Need</Button>
      </div>

      <div className="space-y-4">
        {needs.length > 0 ? (
          needs.map((need: any) => (
            <div key={need.id} className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{need.title}</p>
                  <p className="text-sm text-gray-500">
                    {need.date.toLocaleDateString()} &middot; {need.signups.length} / {need.slotsNeeded} Filled
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => toggleExpand(need.id)}>
                  {expandedNeedId === need.id ? 'Hide Signups' : 'View Signups'}
                </Button>
              </div>
              {expandedNeedId === need.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Signed Up Volunteers:</h4>
                  {need.signups.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {need.signups.map(({ user, signup }: any) => (
                        <li key={signup.id} className="py-2 flex items-center space-x-3">
                          <img src={user.profile.avatarUrl || '/placeholder-avatar.svg'} alt={user.profile.displayName} className="w-8 h-8 rounded-full" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.profile.displayName}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No volunteers have signed up for this opportunity yet.</p>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">No Volunteer Needs Created</h3>
            <p className="mt-1 text-sm text-gray-500">Click “Create Need” to get started.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Volunteer Need">
        <VolunteerNeedForm onSubmit={handleCreateNeed} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default VolunteeringTab;
