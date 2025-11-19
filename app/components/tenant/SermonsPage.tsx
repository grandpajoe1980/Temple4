"use client"

import React from 'react';
import type { Tenant, User } from '@prisma/client';
import Button from '../ui/Button';
import SermonCard from './SermonCard';

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
  tenant: Pick<Tenant, 'name'>;
  user: User;
  sermons: EnrichedSermon[];
  canCreate: boolean;
}

const SermonsPage: React.FC<SermonsPageProps> = ({ tenant, user, sermons, canCreate }) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sermons</h2>
          <p className="mt-1 text-sm text-gray-500">
            Watch recent sermons from {tenant.name}.
          </p>
        </div>
        {canCreate && (
            <Button onClick={() => alert('Open "New Sermon" form (not implemented).')}>
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
    </div>
  );
};

export default SermonsPage;
