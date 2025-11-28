"use client"

import React, { useMemo, useState } from 'react';
import type { EnrichedMediaItem, Tenant, User } from '@/types';
import Button from '../ui/Button';
import PodcastCard from './PodcastCard';
import Modal from '../ui/Modal';
import PodcastForm, { type PodcastFormData } from './forms/PodcastForm';
import ContentChips from './content-chips';
import CommunityHeader from './CommunityHeader';

type SerializedEnrichedPodcast = Omit<EnrichedMediaItem, 'publishedAt'> & {
  publishedAt: string | Date;
};

type UserWithProfile = User & { profile?: any | null };

interface PodcastsPageProps {
  tenant: Pick<Tenant, 'id' | 'name'>;
  user: UserWithProfile;
  podcasts: SerializedEnrichedPodcast[];
  canCreate: boolean;
}

const PodcastsPage: React.FC<PodcastsPageProps> = ({ tenant, user, podcasts: initialPodcasts, canCreate }) => {
  const hydratedPodcasts = useMemo(
    () =>
      initialPodcasts.map((podcast) => ({
        ...podcast,
        publishedAt: podcast.publishedAt instanceof Date ? podcast.publishedAt : new Date(podcast.publishedAt),
      })),
    [initialPodcasts]
  );

  const [podcasts, setPodcasts] = useState<EnrichedMediaItem[]>(hydratedPodcasts);
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

      const newPodcast: SerializedEnrichedPodcast = await response.json();
      setPodcasts([
        {
          ...newPodcast,
          publishedAt: new Date(newPodcast.publishedAt),
          authorDisplayName: user.profile?.displayName || user.email || 'You',
          authorAvatarUrl: (user.profile as any)?.avatarUrl ?? undefined,
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
      <ContentChips tenantId={tenant.id} active="Podcasts" />
      <CommunityHeader
        title={<>Podcasts</>}
        subtitle={<>Listen to the latest episodes from {tenant.name}.</>}
        actions={
          canCreate ? (
            <Button data-test="create-podcast-trigger" onClick={() => setIsModalOpen(true)}>+ New Podcast</Button>
          ) : undefined
        }
      />

      {podcasts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {podcasts.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} />
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} dataTest="create-podcast-modal" title="Create a New Podcast Episode">
        <PodcastForm onSubmit={handleCreatePodcast} onCancel={() => setIsModalOpen(false)} isSubmitting={isSubmitting} />
      </Modal>
    </div>
  );
};

export default PodcastsPage;
