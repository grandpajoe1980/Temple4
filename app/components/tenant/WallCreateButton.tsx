"use client";

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ProfilePostForm } from '../profile/ProfilePostForm';
import { createProfilePostClient } from '../profile/profile-post-client';
import { useToast } from '../ui/Toast';

export default function WallCreateButton({ userId, tenantId }: { userId: string; tenantId: string }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();

  const handleCreate = async (data: any) => {
    try {
      const post = await createProfilePostClient(userId, data);
      setOpen(false);
      toast.success('Posted');
      // If post is public, refresh the page so the wall (server) will include it
      if (post.privacy === 'PUBLIC') {
        try {
          window.location.reload();
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error('Create post error', err);
      toast.error('Failed to create post');
    }
  };

  return (
    <div className="mb-4">
      <Button onClick={() => setOpen(true)} variant="primary">Create Post</Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create Post">
        <ProfilePostForm userId={userId} tenantId={tenantId} onSubmit={handleCreate} onCancel={() => setOpen(false)} />
      </Modal>
    </div>
  );
}
