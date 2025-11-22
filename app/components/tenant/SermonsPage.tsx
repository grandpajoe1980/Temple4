"use client"

import React, { useState } from 'react';
import type { Tenant, User } from '@prisma/client';
import Button from '../ui/Button';
import SermonCard from './SermonCard';
import Modal from '../ui/Modal';
import SermonForm, { type SermonFormData } from './forms/SermonForm';
import ContentChips from './content-chips';

// Enriched media item type from data layer
type EnrichedSermon = {
  id: string;
  description: string;
  tenantId: string;
  authorUserId: string;
  type: string;
  title: string;
  publishedAt: Date;
  deletedAt: Date | null;
  embedUrl: string;
  authorDisplayName: string;
  authorAvatarUrl?: string;
};

interface SermonsPageProps {
  tenant: Pick<Tenant, 'id' | 'name'>;
  user: User;
  sermons: EnrichedSermon[];
  canCreate: boolean;
}

const SermonsPage: React.FC<SermonsPageProps> = ({ tenant, user, sermons: initialSermons, canCreate }) => {
  const [sermons, setSermons] = useState<EnrichedSermon[]>(initialSermons);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSermon = async (data: SermonFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tenants/${tenant.id}/sermons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || 'Failed to create sermon');
      }

      const newSermon = await response.json();
      setSermons([
        {
          ...newSermon,
          publishedAt: new Date(newSermon.publishedAt),
          authorDisplayName: user.name || 'You',
          authorAvatarUrl: (user as any)?.profile?.avatarUrl,
        },
        ...sermons,
      ]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create sermon', error);
      alert('Failed to create sermon. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <ContentChips tenantId={tenant.id} active="Sermons" />
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sermons</h2>
          <p className="mt-1 text-sm text-gray-500">
            Watch recent sermons from {tenant.name}.
          </p>
        </div>
        {canCreate && (
            <Button onClick={() => setIsModalOpen(true)}>
            + New Sermon
            </Button>
        )}
      </div>

      {sermons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sermons.map((sermon) => (
            <SermonCard key={sermon.id} sermon={sermon as any} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Sermons Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no sermons here yet. {canCreate ? 'Why not add one?' : ''}
          </p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a New Sermon">
        <SermonForm onSubmit={handleCreateSermon} onCancel={() => setIsModalOpen(false)} isSubmitting={isSubmitting} />
      </Modal>
    </div>
  );
};

export default SermonsPage;
