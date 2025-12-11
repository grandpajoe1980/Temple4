'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';
import Card from '@/app/components/ui/Card';
import { Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FriendsFeedProps {
    currentUserId: string;
}

interface Post {
    id: string;
    userId: string;
    type: string;
    content: string | null;
    linkUrl: string | null;
    linkTitle: string | null;
    linkImage: string | null;
    privacy: string;
    createdAt: string;
    authorDisplayName: string;
    authorAvatarUrl: string | null;
    media: Array<{
        id: string;
        type: string;
        url: string;
    }>;
    reactionCounts: Record<string, number>;
    userReaction: string | null;
    comments: Array<{
        id: string;
        userId: string;
        content: string;
        createdAt: string;
        authorDisplayName: string;
        authorAvatarUrl: string | null;
    }>;
    commentCount: number;
}

const REACTION_EMOJIS: Record<string, string> = {
    LIKE: '👍',
    LOVE: '❤️',
    LAUGH: '😂',
    WOW: '😮',
    SAD: '😢',
    ANGRY: '😠',
};

export function FriendsFeed({ currentUserId }: FriendsFeedProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const initialLoadedRef = useRef(false);

    const fetchPosts = useCallback(async (reset = false) => {
        if (loading) return;
        setLoading(true);

        try {
            const p = reset ? 1 : page;
            const response = await fetch(`/api/friends/feed?page=${p}&limit=10`);

            if (response.ok) {
                const data = await response.json();
                if (reset) {
                    setPosts(data.posts);
                    setPage(2);
                } else {
                    setPosts((prev) => [...prev, ...data.posts]);
                    setPage((prev) => prev + 1);
                }
                setHasMore(data.posts.length > 0 && posts.length + data.posts.length < data.totalCount);
            }
        } catch (error) {
            console.error('Error fetching friends feed:', error);
        } finally {
            setLoading(false);
        }
    }, [page, loading, posts.length]);

    useEffect(() => {
        if (initialLoadedRef.current) return;
        initialLoadedRef.current = true;
        fetchPosts(true);
    }, [fetchPosts]);

    const handleAddComment = async (postId: string, content: string) => {
        try {
            const response = await fetch(`/api/friends/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });

            if (response.ok) {
                // Refresh posts to show new comment
                fetchPosts(true);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    if (posts.length === 0 && !loading) {
        return (
            <Card className="p-8 text-center">
                <p className="text-gray-500">No posts from friends yet.</p>
                <p className="text-gray-400 text-sm mt-2">
                    When your friends share posts with Friends privacy, they&apos;ll appear here.
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <FriendPostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onComment={handleAddComment}
                />
            ))}

            {hasMore && (
                <button
                    onClick={() => fetchPosts(false)}
                    disabled={loading}
                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                    {loading ? 'Loading...' : 'Load More'}
                </button>
            )}
        </div>
    );
}

interface FriendPostCardProps {
    post: Post;
    currentUserId: string;
    onComment: (postId: string, content: string) => Promise<void>;
}

function FriendPostCard({ post, currentUserId, onComment }: FriendPostCardProps) {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalReactions = Object.values(post.reactionCounts).reduce((a, b) => a + b, 0);

    const handleSubmitComment = async () => {
        if (!commentText.trim() || isSubmitting) return;
        setIsSubmitting(true);
        await onComment(post.id, commentText.trim());
        setCommentText('');
        setIsSubmitting(false);
    };

    return (
        <Card className="p-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <UserLink userId={post.userId}>
                    <Avatar
                        src={post.authorAvatarUrl ?? undefined}
                        name={post.authorDisplayName}
                        size="md"
                    />
                </UserLink>
                <div>
                    <UserLink userId={post.userId} className="font-semibold text-gray-900 hover:underline">
                        {post.authorDisplayName}
                    </UserLink>
                    <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })} · {post.privacy.toLowerCase()}
                    </p>
                </div>
            </div>

            {/* Content */}
            {post.content && (
                <p className="text-gray-800 mb-3 whitespace-pre-wrap">{post.content}</p>
            )}

            {/* Link Preview */}
            {post.linkUrl && (
                <a
                    href={post.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-gray-200 rounded-lg overflow-hidden hover:bg-gray-50 transition-colors mb-3"
                >
                    {post.linkImage && (
                        <div className="w-full flex justify-center bg-gray-100">
                            <img
                                src={post.linkImage}
                                alt={post.linkTitle || 'Link preview'}
                                className="object-contain max-h-60"
                            />
                        </div>
                    )}
                    {post.linkTitle && (
                        <div className="p-3">
                            <h4 className="font-semibold text-gray-900">{post.linkTitle}</h4>
                            <p className="text-sm text-gray-500">{new URL(post.linkUrl).hostname}</p>
                        </div>
                    )}
                </a>
            )}

            {/* Media */}
            {post.media.length > 0 && (
                <div className={`grid gap-2 mb-3 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.media.map((media) => (
                        <div key={media.id} className="relative overflow-hidden rounded-lg flex items-center justify-center bg-gray-100">
                            {media.type === 'IMAGE' ? (
                                <img
                                    src={media.url}
                                    alt="Post media"
                                    className="object-contain max-h-60"
                                />
                            ) : media.type === 'VIDEO' ? (
                                <video src={media.url} controls className="max-h-60" />
                            ) : null}
                        </div>
                    ))}
                </div>
            )}

            {/* Reaction Summary */}
            {totalReactions > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 pb-2 border-b border-gray-100">
                    <div className="flex -space-x-1">
                        {Object.entries(post.reactionCounts)
                            .filter(([, count]) => count > 0)
                            .slice(0, 3)
                            .map(([type]) => (
                                <span key={type} className="text-lg">{REACTION_EMOJIS[type]}</span>
                            ))}
                    </div>
                    <span>{totalReactions}</span>
                    {post.commentCount > 0 && (
                        <span className="ml-auto">{post.commentCount} comments</span>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    <Heart className="w-5 h-5" />
                    <span className="font-medium">Like</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">Comment</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    {/* Comment Input */}
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                        />
                        <button
                            onClick={handleSubmitComment}
                            disabled={!commentText.trim() || isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Post
                        </button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3">
                        {post.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                                <UserLink userId={comment.userId} className="flex-shrink-0">
                                    <Avatar
                                        src={comment.authorAvatarUrl ?? undefined}
                                        name={comment.authorDisplayName}
                                        size="sm"
                                    />
                                </UserLink>
                                <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                                    <UserLink userId={comment.userId} className="font-semibold text-sm text-gray-900 hover:underline">
                                        {comment.authorDisplayName}
                                    </UserLink>
                                    <p className="text-gray-800">{comment.content}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
}
