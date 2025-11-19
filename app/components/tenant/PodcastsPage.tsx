"use client"

import React from 'react';
import type { Tenant, User } from '@prisma/client';
import Button from '../ui/Button';
import PodcastCard from './PodcastCard';

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
  tenant: Pick<Tenant, 'name'>;
  user: User;
  podcasts: EnrichedPodcast[];
  canCreate: boolean;
}

const PodcastsPage: React.FC<PodcastsPageProps> = ({ tenant, user, podcasts, canCreate }) => {
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
            <Button onClick={() => alert('Open "New Podcast" form (not implemented).')}>
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
    </div>
  );
};

export default PodcastsPage;
