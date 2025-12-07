"use client"

import React, { useState, useEffect } from 'react';
import type { PostInput, PostWithAuthor } from '@/types';
import type { Tenant } from '@prisma/client';
import type { CurrentUser } from './CommentsSection';
import Button from '../ui/Button';
import PostCard from './PostCard';
import Modal from '../ui/Modal';
import PostForm from './PostForm';
import { useToast } from '../ui/Toast';
import CommunityChips from '../tenant/CommunityChips';
import { useSetPageHeader } from '../ui/PageHeaderContext';

interface PostsPageProps {
  tenant: Pick<Tenant, 'id' | 'name'>;
  user: CurrentUser;
  posts: PostWithAuthor[];
  canCreate: boolean;
}

const PostsPage: React.FC<PostsPageProps> = ({ tenant, user, posts: initialPosts, canCreate }) => {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const setPageHeader = useSetPageHeader();

  useEffect(() => {
    setPageHeader({
      title: 'Posts',
      actions: canCreate ? (
        <Button size="sm" data-test="create-post-trigger" onClick={() => setIsModalOpen(true)}>+ New</Button>
      ) : undefined,
    });
    return () => setPageHeader(null);
  }, [canCreate, setPageHeader]);

  const handleCreatePost = async (postData: PostInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tenants/${tenant.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      
      if (response.ok) {
        const newPost = await response.json();
        // Optimistically update
        setPosts([newPost, ...posts]);
        setIsModalOpen(false);
        toast.success('Post created successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create post. Please try again.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <CommunityChips tenantId={tenant.id} />

      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} tenantId={tenant.id} currentUser={user} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No Posts Yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            {canCreate 
              ? "Get started by creating your first post or announcement." 
              : "Check back later for updates from this community."}
          </p>
          {canCreate && (
            <div className="mt-6">
              <Button data-test="create-post-trigger-2" onClick={() => setIsModalOpen(true)}>
                Create First Post
              </Button>
            </div>
          )}
        </div>
      )}
      
      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} dataTest="create-post-modal" title="Create a New Post">
        <PostForm 
          onSubmit={handleCreatePost} 
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default PostsPage;