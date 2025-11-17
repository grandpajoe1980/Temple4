"use client";

import React, { useState } from 'react';
import type { Tenant, User, PostInput, PostWithAuthor } from '@/types';
import { getPostsForTenant, addPost } from '@/lib/data';
import Button from '../ui/Button';
import PostCard from './PostCard';
import { can } from '@/lib/permissions';
import Modal from '../ui/Modal';
import PostForm from './PostForm';

interface PostsPageProps {
  tenant: Tenant;
  user: User;
}

const PostsPage: React.FC<PostsPageProps> = ({ tenant, user }) => {
  const [posts, setPosts] = useState<PostWithAuthor[]>(() => getPostsForTenant(tenant.id));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canCreate = can(user, tenant, 'canCreatePosts');

  const handleCreatePost = (postData: PostInput) => {
    addPost({
      ...postData,
      tenantId: tenant.id,
      authorUserId: user.id,
    });
    setPosts(getPostsForTenant(tenant.id)); // Re-fetch to get the latest list with the new post
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Posts & Announcements</h2>
          <p className="mt-1 text-sm text-gray-500">
            Read the latest updates from {tenant.name}.
          </p>
        </div>
        {canCreate && (
            <Button onClick={() => setIsModalOpen(true)}>
            + New Post
            </Button>
        )}
      </div>

      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Posts Yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no posts here. {canCreate ? 'Why not create one?' : ''}
          </p>
        </div>
      )}
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a New Post">
        <PostForm onSubmit={handleCreatePost} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default PostsPage;