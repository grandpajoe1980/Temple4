"use client"

import React, { useState } from 'react';
import type { Tenant, User } from '@prisma/client';
import Button from '../ui/Button';
import PodcastCard from './PodcastCard';
import Modal from '../ui/Modal';
import PodcastForm, { type PodcastFormData } from './forms/PodcastForm';

// Enriched media item type from data layer
type EnrichedPodcast = {
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

interface PodcastsPageProps {
  tenant: Pick<Tenant, 'id' | 'name'>;
  user: User;
  podcasts: EnrichedPodcast[];
  canCreate: boolean;
}

const PodcastsPage: React.FC<PodcastsPageProps> = ({ tenant, user, podcasts: initialPodcasts, canCreate }) => {
  const [podcasts, setPodcasts] = useState<EnrichedPodcast[]>(initialPodcasts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePodcast = async (data: PodcastFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tenants/${tenant.id}/podcasts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          embedUrl: data.embedUrl,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || 'Failed to create podcast');
      }

      const newPodcast = await response.json();
      setPodcasts([
        {
          ...newPodcast,
          publishedAt: new Date(newPodcast.publishedAt),
          authorDisplayName: user.name || 'You',
          authorAvatarUrl: (user as any)?.profile?.avatarUrl,
        },
        ...podcasts,
      ]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create podcast', error);
      alert('Failed to create podcast. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Podcasts</h2>
          <p className="mt-1 text-sm text-gray-500">
            Listen to the latest episodes from {tenant.name}.
          </p>
        </div>
        {canCreate && (
            <Button onClick={() => setIsModalOpen(true)}>
            + New Podcast
            </Button>
        )}
      </div>

      {podcasts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {podcasts.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast as any} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Podcasts Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no podcasts here yet. {canCreate ? 'Why not add one?' : ''}
          </p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a New Podcast Episode">
        <PodcastForm onSubmit={handleCreatePodcast} onCancel={() => setIsModalOpen(false)} isSubmitting={isSubmitting} />
      </Modal>
    </div>
  );
};

export default PodcastsPage;
