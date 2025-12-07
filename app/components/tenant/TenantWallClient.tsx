"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ProfilePostForm } from '../profile/ProfilePostForm';
import { createProfilePostClient } from '../profile/profile-post-client';
import { useToast } from '../ui/Toast';

type CommentDto = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  authorDisplayName: string;
  authorAvatarUrl?: string | null;
};

type PostDto = {
  id: string;
  userId: string;
  content?: string | null;
  linkUrl?: string | null;
  linkTitle?: string | null;
  linkImage?: string | null;
  media: Array<{ id: string; url: string; mimeType: string }>; 
  createdAt: string;
  authorDisplayName: string;
  authorAvatarUrl?: string | null;
  comments: CommentDto[];
};

export default function TenantWallClient({ tenantId, initialPosts, showCreateButton = true, canModerate = false }: { tenantId: string; initialPosts: PostDto[]; showCreateButton?: boolean; canModerate?: boolean }) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<PostDto[]>(initialPosts || []);
  const toast = useToast();
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const currentUserId = (session?.user as any)?.id;

  async function submitComment(postId: string) {
    const content = (commentText[postId] || '').trim();
    if (!content) return;

    try {
      const res = await fetch(`/api/tenants/${tenantId}/wall/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content }),
      });
      if (!res.ok) throw new Error('Failed');
      const comment = await res.json();
      setPosts((prev) => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p));
      setCommentText((s) => ({ ...s, [postId]: '' }));
    } catch (e) {
      console.error('[TenantWallClient] submitComment error', e);
      toast?.error?.('Failed to submit comment');
    }
  }

  async function hidePost(postId: string) {
    if (!confirm('Hide this post from the wall?')) return;
    try {
      const res = await fetch(`/api/tenants/${tenantId}/wall/hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) throw new Error('Failed');
      // remove from list
      setPosts((prev) => prev.filter(p => p.id !== postId));
    } catch (e) {
      // ignore
    }
  }

  const handleCreate = async (data: any) => {
    if (!currentUserId) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticPost: PostDto = {
      id: tempId,
      userId: currentUserId,
      content: data.content || null,
      linkUrl: data.linkUrl || null,
      linkTitle: data.linkTitle || null,
      linkImage: data.linkImage || null,
      media: [],
      createdAt: new Date().toISOString(),
      authorDisplayName: 'You',
      authorAvatarUrl: null,
      comments: [],
    } as any;

    setPosts(prev => [optimisticPost, ...prev]);
    setShowForm(false);
    toast.info('Posting...', 10000);

    try {
      const newPost = await createProfilePostClient(currentUserId, data);
      // Only show on tenant wall if post is PUBLIC
      if (newPost.privacy === 'PUBLIC') {
        setPosts(prev => prev.map(p => p.id === tempId ? newPost : p));
        toast.success('Posted');
      } else {
        // remove optimistic placeholder if not public
        setPosts(prev => prev.filter(p => p.id !== tempId));
        toast.success('Posted to your profile');
      }
    } catch (err) {
      console.error('Create post error', err);
      // Remove optimistic post
      setPosts(prev => prev.filter(p => p.id !== tempId));
      toast.error('Failed to create post');
    }
  };

  return (
    <div className="space-y-6">
      {posts.length === 0 && <div className="text-sm text-gray-600">No public member posts yet.</div>}

      {posts.map((post) => (
        <div key={post.id} className="rounded-md border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{post.authorDisplayName}</div>
                  <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  {(currentUserId === post.userId || canModerate || (session?.user as any)?.isSuperAdmin) && (
                    <button onClick={() => hidePost(post.id)} className="text-sm text-red-600">Hide</button>
                  )}
                </div>
              </div>

              {post.content && <div className="mt-3 text-gray-800">{post.content}</div>}

              {/* Render media images if present */}
              {post.media && post.media.length > 0 && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {post.media.map((m) => (
                    <img key={m.id} src={m.url} alt="post media" className="w-full h-auto rounded-md object-cover" />
                  ))}
                </div>
              )}

              {/* Render link preview if present */}
              {post.linkUrl && (
                <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-md border border-gray-200 overflow-hidden hover:shadow">
                  <div className="flex">
                    {post.linkImage && <img src={post.linkImage} alt={post.linkTitle || 'link image'} className="w-24 h-24 object-cover" />}
                    <div className="p-3">
                      <div className="text-sm font-medium text-gray-900">{post.linkTitle || post.linkUrl}</div>
                      <div className="text-xs text-gray-600 mt-1">{post.linkUrl}</div>
                    </div>
                  </div>
                </a>
              )}

              <div className="mt-3">
                <div className="text-sm font-semibold">Comments</div>
                <div className="space-y-2 mt-2">
                  {post.comments.map((c) => (
                    <div key={c.id} className="text-sm">
                      <span className="font-medium">{c.authorDisplayName}</span>: {c.content}
                    </div>
                  ))}
                </div>

                {session?.user && (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={commentText[post.id] || ''}
                      onChange={(e) => setCommentText((s) => ({ ...s, [post.id]: e.target.value }))}
                      className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm"
                      placeholder="Write a comment..."
                    />
                    <button onClick={() => submitComment(post.id)} className="px-3 py-1 text-white rounded text-sm" style={{ backgroundColor: 'var(--primary)' }}>Comment</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
