"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';
import type { User } from '@prisma/client';
import type { PostCommentWithAuthor } from '@/types';

export type CurrentUser = User & {
  profile?: {
    avatarUrl?: string | null;
    displayName?: string | null;
  } | null;
};
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

interface CommentsSectionProps {
  tenantId: string;
  postId: string;
  currentUser: CurrentUser;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ tenantId, postId, currentUser }) => {
  const [comments, setComments] = useState<PostCommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const toast = useToast();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/tenants/${tenantId}/posts/${postId}/comments`);
        if (!response.ok) {
          throw new Error('Failed to load comments');
        }
        const data = await response.json();
        setComments(
          data.map((comment: any) => ({
            ...comment,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
          }))
        );
      } catch (error) {
        toast.error('Unable to load comments right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [tenantId, postId, toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/tenants/${tenantId}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newComment.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error?.message || 'Failed to post comment.');
        return;
      }

      const created = await response.json();
      const normalized: PostCommentWithAuthor = {
        ...created,
        createdAt: new Date(created.createdAt),
        updatedAt: new Date(created.updatedAt),
      };

      setComments((prev) => [...prev, normalized]);
      setNewComment('');
    } catch (error) {
      toast.error('Something went wrong while posting your comment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-gray-200 px-6 py-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Add Comment</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-start space-x-3">
          <UserLink userId={currentUser.id}>
            <Avatar
              src={currentUser.profile?.avatarUrl || '/placeholder-avatar.svg'}
              name={currentUser.profile?.displayName || currentUser.email || 'Your avatar'}
              size="md"
            />
          </UserLink>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="flex-1 rounded-md border border-gray-300 shadow-sm focus:tenant-border-200 focus:ring-[rgb(var(--primary-rgb))] text-sm p-2"
            rows={2}
          />
        </div>
        <div className="text-right">
          <Button type="submit" disabled={submitting || !newComment.trim()}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>

      <div className="mt-4 space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet. Be the first to share.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <div className="flex-shrink-0">
                <UserLink userId={comment.authorUserId}>
                  <Avatar src={comment.authorAvatarUrl || '/placeholder-avatar.svg'} name={comment.authorDisplayName} size="md" />
                </UserLink>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <UserLink userId={comment.authorUserId} className="text-sm font-semibold text-gray-900 hover:tenant-text-primary inline-block">
                    {comment.authorDisplayName}
                  </UserLink>
                  <span className="text-xs text-gray-500">
                    {comment.createdAt.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{comment.body}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
