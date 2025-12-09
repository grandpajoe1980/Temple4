'use client';

import { useState } from 'react';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';
import { Heart, MessageCircle, Smile, Trash2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProfilePostCardProps {
    post: {
        id: string;
        userId: string;
        type: string;
        content?: string | null;
        linkUrl?: string | null;
        linkTitle?: string | null;
        linkImage?: string | null;
        privacy: string;
        createdAt: string;
        authorDisplayName: string;
        authorAvatarUrl?: string | null;
        media: any[];
        reactionCounts: Record<string, number>;
        userReaction?: string | null;
        comments: any[];
    };
    currentUserId?: string;
    onReact?: (postId: string, reactionType: string) => void;
    onComment?: (postId: string, content: string) => void;
    onDelete?: (postId: string) => void;
}

const REACTION_EMOJIS: Record<string, string> = {
    LIKE: '👍',
    LOVE: '❤️',
    LAUGH: '😂',
    WOW: '😮',
    SAD: '😢',
    ANGRY: '😠',
};

export function ProfilePostCard({
    post,
    currentUserId,
    onReact,
    onComment,
    onDelete,
}: ProfilePostCardProps) {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showReactionPicker, setShowReactionPicker] = useState(false);

    const isOwnPost = currentUserId === post.userId;
    const totalReactions = Object.values(post.reactionCounts).reduce((a, b) => a + b, 0);

    const handleReaction = (type: string) => {
        onReact?.(post.id, type);
        setShowReactionPicker(false);
    };

    const handleComment = () => {
        if (commentText.trim()) {
            onComment?.(post.id, commentText);
            setCommentText('');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <UserLink userId={post.userId} className="inline-flex items-center">
                        <Avatar src={post.authorAvatarUrl ?? undefined} name={post.authorDisplayName} size="md" />
                    </UserLink>
                    <div>
                        <UserLink userId={post.userId} className="font-semibold text-gray-900">
                          <h3 className="font-semibold text-gray-900">{post.authorDisplayName}</h3>
                        </UserLink>
                        <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })} · {post.privacy.toLowerCase()}
                        </p>
                    </div>
                </div>
                {isOwnPost && (
                    <button
                        onClick={() => onDelete?.(post.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                )}
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
                        <div className="w-full flex justify-center">
                            <img
                                src={post.linkImage}
                                alt={post.linkTitle || 'Link preview'}
                                className="object-contain mx-auto"
                                style={{ display: 'block', maxWidth: '720px', maxHeight: '240px', width: 'auto', height: 'auto' }}
                            />
                        </div>
                    )}
                    <div className="p-3">
                        <h4 className="font-semibold text-gray-900 mb-1">{post.linkTitle}</h4>
                        <p className="text-sm text-gray-500">{new URL(post.linkUrl).hostname}</p>
                    </div>
                </a>
            )}

            {/* Image-only post (no linkUrl) */}
            {!post.linkUrl && post.linkImage && (
                <div className="mb-3 overflow-hidden rounded-lg">
                    <img
                        src={post.linkImage}
                        alt={post.linkTitle || 'Post image'}
                        className="object-contain rounded-lg mx-auto"
                        style={{ display: 'block', maxWidth: '720px', maxHeight: '240px', width: 'auto', height: 'auto' }}
                    />
                    {post.linkTitle && (
                        <div className="p-3">
                            <h4 className="font-semibold text-gray-900 mb-1">{post.linkTitle}</h4>
                        </div>
                    )}
                </div>
            )}

            {/* Media */}
            {post.media.length > 0 && (
                <div className={`grid gap-2 mb-3 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.media.map((media) => (
                        <div key={media.id} className="relative overflow-hidden rounded-lg flex items-center justify-center">
                            {media.type === 'IMAGE' ? (
                                <img
                                    src={media.url}
                                    alt="Post media"
                                    className="object-contain rounded-lg"
                                    style={{ display: 'block', maxWidth: post.media.length === 1 ? '720px' : '360px', maxHeight: post.media.length === 1 ? '240px' : '160px', width: 'auto', height: 'auto' }}
                                />
                            ) : media.type === 'VIDEO' ? (
                                <video
                                    src={media.url}
                                    controls
                                    className="rounded-lg"
                                    style={{ display: 'block', maxWidth: post.media.length === 1 ? '720px' : '360px', maxHeight: post.media.length === 1 ? '240px' : '160px', width: 'auto', height: 'auto' }}
                                />
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
                            .filter(([_, count]) => count > 0)
                            .slice(0, 3)
                            .map(([type]) => (
                                <span key={type} className="text-lg">
                                    {REACTION_EMOJIS[type]}
                                </span>
                            ))}
                    </div>
                    <span>{totalReactions}</span>
                    {post.comments.length > 0 && (
                        <span className="ml-auto">{post.comments.length} comments</span>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                <div className="relative">
                    <button
                        onClick={() => setShowReactionPicker(!showReactionPicker)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${post.userReaction
                                ? 'text-blue-600 bg-blue-50'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {post.userReaction ? (
                            <span className="text-lg">{REACTION_EMOJIS[post.userReaction]}</span>
                        ) : (
                            <Heart className="w-5 h-5" />
                        )}
                        <span className="font-medium">
                            {post.userReaction ? REACTION_EMOJIS[post.userReaction] : 'Like'}
                        </span>
                    </button>

                    {showReactionPicker && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex gap-2 z-10">
                            {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                                <button
                                    key={type}
                                    onClick={() => handleReaction(type)}
                                    className="text-2xl hover:scale-125 transition-transform"
                                    title={type}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

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
                            onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                        />
                        <button
                            onClick={handleComment}
                            disabled={!commentText.trim()}
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
                                  <Avatar src={comment.authorAvatarUrl ?? undefined} name={comment.authorDisplayName} size="sm" />
                                </UserLink>
                                <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                                    <UserLink userId={comment.userId} className="font-semibold text-sm text-gray-900 hover:tenant-text-primary inline-block">
                                      <p className="font-semibold text-sm text-gray-900">{comment.authorDisplayName}</p>
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
        </div>
    );
}
