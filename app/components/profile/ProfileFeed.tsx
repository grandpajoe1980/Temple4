"use client";
import Button from '../ui/Button';




import { useEffect, useState, useCallback, useRef } from 'react';
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
    const loadingRef = useRef(false);
    const pageRef = useRef(page);
    const initialLoadedRef = useRef(false);
    const fetchCountRef = useRef(0);
    const [showForm, setShowForm] = useState(false);

    // Use refs to avoid recreating the callback when `posts`/`page`/`loading` change,
    // which previously caused the effect that calls `fetchPosts` on mount to re-run
    // repeatedly. We use functional updates for state to keep values correct.
    useEffect(() => { pageRef.current = page; }, [page]);

    const fetchPosts = useCallback(async (reset = false) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            const p = reset ? 1 : pageRef.current;
            const result = await fetchProfilePosts(userId, p, 10);
            if (reset) {
                setPosts(() => result.posts);
                setPage(2);
                pageRef.current = 2;
            } else {
                setPosts(prev => [...prev, ...result.posts]);
                setPage(prev => {
                    const next = prev + 1;
                    pageRef.current = next;
                    return next;
                });
            }
            setHasMore(prev => {
                const totalLoaded = (reset ? result.posts.length : (pageRef.current - 1) * 10 + result.posts.length);
                return totalLoaded < result.totalCount;
            });
        } catch (e) {
            console.error('Failed to load posts', e);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (initialLoadedRef.current) return;
        initialLoadedRef.current = true;
        fetchPosts(true);
    }, [fetchPosts]);

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
                    <Button data-test="create-post-trigger-profile" onClick={() => setShowForm(true)} variant="primary">
                        Create Post
                    </Button>
                    <Modal isOpen={showForm} onClose={() => setShowForm(false)} dataTest="create-post-modal-profile" title="Create Post">
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
