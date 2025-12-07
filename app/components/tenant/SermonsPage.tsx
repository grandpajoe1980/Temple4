"use client"

import React, { useState, useEffect } from 'react';
import type { Tenant, User } from '@prisma/client';
import type { EnrichedMediaItem } from '@/types';
import Button from '../ui/Button';
import TalkCard from './SermonCard';
import Modal from '../ui/Modal';
import TalkForm, { type TalkFormData } from './forms/SermonForm';
import ContentChips from './content-chips';
import { useSetPageHeader } from '../ui/PageHeaderContext';

interface TalksPageProps {
  tenant: Pick<Tenant, 'id' | 'name'>;
  user: User;
  talks: EnrichedMediaItem[];
  canCreate: boolean;
}

const TalksPage: React.FC<TalksPageProps> = ({ tenant, user, talks: initialTalks, canCreate }) => {
  const [talks, setTalks] = useState<EnrichedMediaItem[]>(initialTalks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTalk, setEditingTalk] = useState<EnrichedMediaItem | null>(null);
  const setPageHeader = useSetPageHeader();

  useEffect(() => {
    setPageHeader({
      title: 'Talks',
      actions: canCreate ? (
        <Button size="sm" data-test="create-talk-trigger" onClick={() => setIsModalOpen(true)}>+ New</Button>
      ) : undefined,
    });
    return () => setPageHeader(null);
  }, [canCreate, setPageHeader]);

  const handleCreateTalk = async (data: TalkFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tenants/${tenant.id}/talks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || 'Failed to create talk');
      }

      const newTalk = await response.json();
      setTalks([
        {
          ...newTalk,
          publishedAt: new Date(newTalk.publishedAt),
          authorDisplayName: user.name || 'You',
          authorAvatarUrl: (user as any)?.profile?.avatarUrl,
        },
        ...talks,
      ]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create talk', error);
      alert('Failed to create talk. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTalk = (talk: EnrichedMediaItem) => {
    setEditingTalk(talk);
    setIsModalOpen(true);
  };

  const handleUpdateTalk = async (data: TalkFormData) => {
    if (!editingTalk) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/talks/${editingTalk.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update talk');
      const updated = await res.json();
      setTalks(talks.map(s => s.id === updated.id ? { ...s, ...updated, publishedAt: new Date(updated.publishedAt) } : s));
      setIsModalOpen(false);
      setEditingTalk(null);
    } catch (e) {
      console.error(e);
      alert('Failed to update talk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTalk = async (talk: EnrichedMediaItem) => {
    if (!confirm('Delete this talk?')) return;
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/talks/${talk.id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setTalks(talks.filter(s => s.id !== talk.id));
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || 'Failed to delete talk');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete talk');
    }
  };

  return (
    <div className="space-y-8">
      <ContentChips tenantId={tenant.id} active="Talks" />

      {talks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {talks.map((talk) => (
            <TalkCard key={talk.id} talk={talk as any} canEdit={canCreate} onEdit={handleEditTalk} onDelete={handleDeleteTalk} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Talks Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no talks here yet. {canCreate ? 'Why not add one?' : ''}
          </p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTalk(null); }} dataTest="create-talk-modal" title={editingTalk ? 'Edit Talk' : 'Create a New Talk'}>
        <TalkForm onSubmit={editingTalk ? handleUpdateTalk : handleCreateTalk} onCancel={() => { setIsModalOpen(false); setEditingTalk(null); }} isSubmitting={isSubmitting} initial={editingTalk ? { title: editingTalk.title, description: editingTalk.description, embedUrl: editingTalk.embedUrl } : undefined} />
      </Modal>
    </div>
  );
};

export default TalksPage;
