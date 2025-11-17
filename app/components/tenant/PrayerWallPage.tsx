"use client";

import React, { useState, useMemo } from 'react';
import type { Tenant, User } from '@/types';
import { getCommunityPostsForTenant, addCommunityPost } from '@/lib/data';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import PrayerPostCard from './PrayerPostCard';
import SubmitPrayerPostForm from './forms/SubmitPrayerPostForm';
import { CommunityPostStatus, CommunityPostType } from '@/types';

interface PrayerWallPageProps {
  tenant: Tenant;
  user: User;
  onRefresh: () => void;
}

const PrayerWallPage: React.FC<PrayerWallPageProps> = ({ tenant, user, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const posts = useMemo(() => {
    const allPosts = getCommunityPostsForTenant(tenant.id, false);
    return allPosts.filter(p => p.status === CommunityPostStatus.PUBLISHED);
  }, [tenant.id, onRefresh]);

  const handleCreatePost = (data: { type: CommunityPostType; body: string; isAnonymous: boolean }) => {
    addCommunityPost({
      tenantId: tenant.id,
      authorUserId: data.isAnonymous ? null : user.id,
      ...data,
    });
    onRefresh();
    setIsModalOpen(false);
    alert('Your request has been submitted for review.');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Community Prayer Wall</h2>
          <p className="mt-1 text-sm text-gray-500">
            Share prayer requests and tangible needs with the {tenant.name} community.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Submit a Request</Button>
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <PrayerPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">The Prayer Wall is Empty</h3>
          <p className="mt-1 text-sm text-gray-500">
            Be the first to submit a prayer request or tangible need.
          </p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit a Request">
        <SubmitPrayerPostForm
          onSubmit={handleCreatePost}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default PrayerWallPage;