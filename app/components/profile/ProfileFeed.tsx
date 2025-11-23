"use client";
import Button from '../ui/Button';




import { useEffect, useState, useCallback } from 'react';
import { ProfilePostCard } from './ProfilePostCard';
import { ProfilePostForm } from './ProfilePostForm';
import Modal from '../ui/Modal';
import { fetchProfilePosts, createProfilePostClient, addReactionClient, addCommentClient, deleteProfilePostClient } from './profile-post-client';
import { useToast } from '../ui/Toast';

interface ProfileFeedProps {
    userId: string;
    isOwnProfile: boolean;
    tenantId?: string | null;
}

export function ProfileFeed({ userId, isOwnProfile, tenantId }: ProfileFeedProps) {
    const toast = useToast();
    const [posts, setPosts] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const fetchPosts = useCallback(async (reset = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const result = await fetchProfilePosts(userId, reset ? 1 : page, 10);
            const newPosts = reset ? result.posts : [...posts, ...result.posts];
            setPosts(newPosts);
            setHasMore(newPosts.length < result.totalCount);
            if (!reset) setPage(p => p + 1);
        } catch (e) {
            console.error('Failed to load posts', e);
        } finally {
            setLoading(false);
        }
    }, [userId, page, posts, loading]);

    useEffect(() => {
        fetchPosts(true);
    }, [userId]);

    const handleCreate = async (data: any) => {
        // Optimistic UI: insert a temporary post immediately
        const tempId = `temp-${Date.now()}`;
        const optimisticPost = {
            id: tempId,
            userId,
            type: data.type || 'TEXT',
            content: data.content || null,
            linkUrl: data.linkUrl || null,
            linkTitle: data.linkTitle || null,
            linkImage: data.linkImage || null,
            privacy: data.privacy || 'PUBLIC',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            authorDisplayName: 'You',
            authorAvatarUrl: null,
            media: [],
            reactions: [],
            comments: [],
            reactionCounts: { LIKE: 0, LOVE: 0, LAUGH: 0, WOW: 0, SAD: 0, ANGRY: 0 },
            userReaction: null,
            _optimistic: true,
        };

        setPosts(prev => [optimisticPost, ...prev]);
        setShowForm(false);
        const postingToastId = `posting-${tempId}`;
        toast.info('Posting...', 10000);

        try {
            const newPost = await createProfilePostClient(userId, data);
            // Replace optimistic post with server post
            setPosts(prev => prev.map(p => (p.id === tempId ? newPost : p)));
            toast.success('Posted');
        } catch (e) {
            console.error('Create post error', e);
            // Remove optimistic post
            setPosts(prev => prev.filter(p => p.id !== tempId));
            toast.error('Failed to create post');
        }
    };

    const handleReact = async (postId: string, type: string) => {
        try {
            await addReactionClient(userId, postId, type as any);
            // Refresh post list
            fetchPosts(true);
        } catch (e) {
            console.error('Reaction error', e);
        }
    };

    const handleComment = async (postId: string, content: string) => {
        try {
            await addCommentClient(userId, postId, content);
            fetchPosts(true);
        } catch (e) {
            console.error('Comment error', e);
        }
    };

    const handleDelete = async (postId: string) => {
        try {
            await deleteProfilePostClient(userId, postId);
            setPosts(posts.filter(p => p.id !== postId));
        } catch (e) {
            console.error('Delete error', e);
        }
    };

    const loadMore = () => {
        if (hasMore && !loading) fetchPosts();
    };

    return (
        <div>
            {isOwnProfile && (
                <div className="mb-4">
                    <Button onClick={() => setShowForm(true)} variant="primary">
                        Create Post
                    </Button>
                    <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create Post">
                        <ProfilePostForm userId={userId} tenantId={tenantId} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
                    </Modal>
                </div>
            )}
            {posts.map(post => (
                <ProfilePostCard
                    key={post.id}
                    post={post}
                    currentUserId={userId}
                    onReact={handleReact}
                    onComment={handleComment}
                    onDelete={handleDelete}
                />
            ))}
            {hasMore && (
                <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full py-2 mt-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Load More'}
                </button>
            )}
        </div>
    );
}
