"use client"

import React, { useEffect, useState } from 'react';
import type { Tenant, PostWithAuthor } from '@/types';
// Map post DTOs locally to avoid importing server-only helpers

interface PublicPostsViewProps {
  tenant: Tenant;
}

const PublicPostsView: React.FC<PublicPostsViewProps> = ({ tenant }) => {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      try {
        const response = await fetch(`/api/tenants/${tenant.id}/posts?limit=20`);
        if (!response.ok) {
          setPosts([]);
          return;
        }

        const payload = await response.json();
        if (!isMounted) return;

        const normalized = (payload.posts || []).map((post: any) => ({
          id: post.id,
          tenantId: post.tenantId,
          authorUserId: post.authorUserId,
          type: post.type,
          title: post.title,
          body: post.body,
          isPublished: post.isPublished,
          publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt),
          authorDisplayName: post.authorDisplayName,
          authorAvatarUrl: post.authorAvatarUrl ?? undefined,
        } as any));

        setPosts(normalized);
      } catch (error) {
        setPosts([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, [tenant.id]);

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading posts...</div>;
  }

  return (
    <div className="space-y-6">
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm p-6 space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {post.type}
                </span>
                <h3 className="text-xl font-semibold text-gray-900">{post.title}</h3>
              </div>
              <time dateTime={post.publishedAt.toISOString()} className="text-sm text-gray-500">
                {post.publishedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
            </div>
            <p className="text-gray-700 line-clamp-3">{post.body}</p>
            <div className="flex items-center space-x-2 pt-2 text-sm text-gray-600">
              <img
                className="h-8 w-8 rounded-full"
                src={post.authorAvatarUrl || '/placeholder-avatar.svg'}
                alt={post.authorDisplayName}
              />
              <span className="font-medium">{post.authorDisplayName}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Posts Yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no public posts here at this time.
          </p>
        </div>
      )}
    </div>
  );
};

export default PublicPostsView;
