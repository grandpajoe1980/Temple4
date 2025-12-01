"use client"

import React, { useState } from 'react';
import type { Tenant, User } from '@prisma/client';
import type { EnrichedMediaItem } from '@/types';
import Button from '../ui/Button';
import SermonCard from './SermonCard';
import Modal from '../ui/Modal';
import SermonForm, { type SermonFormData } from './forms/SermonForm';
import ContentChips from './content-chips';
import CommunityHeader from './CommunityHeader';

interface SermonsPageProps {
  tenant: Pick<Tenant, 'id' | 'name'>;
  user: User;
  sermons: EnrichedMediaItem[];
  canCreate: boolean;
}

const SermonsPage: React.FC<SermonsPageProps> = ({ tenant, user, sermons: initialSermons, canCreate }) => {
  const [sermons, setSermons] = useState<EnrichedMediaItem[]>(initialSermons);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSermon, setEditingSermon] = useState<EnrichedMediaItem | null>(null);

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

  const handleEditSermon = (sermon: EnrichedMediaItem) => {
    setEditingSermon(sermon);
    setIsModalOpen(true);
  };

  const handleUpdateSermon = async (data: SermonFormData) => {
    if (!editingSermon) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/sermons/${editingSermon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update sermon');
      const updated = await res.json();
      setSermons(sermons.map(s => s.id === updated.id ? { ...s, ...updated, publishedAt: new Date(updated.publishedAt) } : s));
      setIsModalOpen(false);
      setEditingSermon(null);
    } catch (e) {
      console.error(e);
      alert('Failed to update sermon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSermon = async (sermon: EnrichedMediaItem) => {
    if (!confirm('Delete this sermon?')) return;
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/sermons/${sermon.id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setSermons(sermons.filter(s => s.id !== sermon.id));
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || 'Failed to delete sermon');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete sermon');
    }
  };

  return (
    <div className="space-y-8">
      <ContentChips tenantId={tenant.id} active="Sermons" />
      <CommunityHeader
        title={<>Sermons</>}
        subtitle={<>Watch recent sermons from {tenant.name}.</>}
        actions={
          canCreate ? (
            <Button data-test="create-sermon-trigger" onClick={() => setIsModalOpen(true)}>+ New Sermon</Button>
          ) : undefined
        }
      />

      {sermons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sermons.map((sermon) => (
            <SermonCard key={sermon.id} sermon={sermon as any} canEdit={canCreate} onEdit={handleEditSermon} onDelete={handleDeleteSermon} />
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

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingSermon(null); }} dataTest="create-sermon-modal" title={editingSermon ? 'Edit Sermon' : 'Create a New Sermon'}>
        <SermonForm onSubmit={editingSermon ? handleUpdateSermon : handleCreateSermon} onCancel={() => { setIsModalOpen(false); setEditingSermon(null); }} isSubmitting={isSubmitting} initial={editingSermon ? { title: editingSermon.title, description: editingSermon.description, embedUrl: editingSermon.embedUrl } : undefined} />
      </Modal>
    </div>
  );
};

export default SermonsPage;
