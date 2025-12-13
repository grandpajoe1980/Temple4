import React from 'react';
import type { PostWithAuthor } from '@/types';
import Card from '../ui/Card';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';
import useTranslation from '@/app/hooks/useTranslation';

interface BookCardProps {
    post: PostWithAuthor;
    canEdit?: boolean;
    onEdit?: (post: PostWithAuthor) => void;
    onDelete?: (post: PostWithAuthor) => void;
}

const BookCard: React.FC<BookCardProps> = ({ post, canEdit = false, onEdit, onDelete }) => {
    const { t, lang } = useTranslation();
    const localeCode = lang === 'vi' ? 'vi-VN' : lang === 'es' ? 'es-ES' : 'en-US';

    const postTypeLabels: Record<string, string> = {
        ANNOUNCEMENT: t('posts.typeAnnouncement'),
        BLOG: t('posts.typeBlog'),
        BOOK: t('posts.typeBook'),
    };

    return (
        <Card className="relative !p-0 overflow-visible">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800`}>
                            {postTypeLabels[post.type] || post.type}
                        </span>
                        <h3 className="mt-2 text-xl font-semibold text-gray-900 hover:tenant-text-primary cursor-pointer">
                            {post.title}
                        </h3>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                        {canEdit ? (
                            <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
                                <button onClick={() => onEdit?.(post)} className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center" title="Edit">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" fill="currentColor" /></svg>
                                </button>
                                <button onClick={() => onDelete?.(post)} className="h-9 w-9 rounded-full bg-red-600 text-white flex items-center justify-center" title="Delete">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 7L5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>

                <p className="mt-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {post.body}
                </p>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between text-sm">
                <UserLink userId={(post as any).authorUserId} className="flex items-center space-x-3">
                    <Avatar src={post.authorAvatarUrl} name={post.authorDisplayName} size="sm" />
                    <span className="font-medium text-gray-800">{post.authorDisplayName}</span>
                </UserLink>
                <time dateTime={post.publishedAt.toISOString()} className="text-gray-500">
                    {post.publishedAt.toLocaleDateString(localeCode, { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
            </div>
        </Card>
    );
};

export default BookCard;