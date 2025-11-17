import React from 'react';
import type { PostWithAuthor } from '@/types';
import Card from '../ui/Card';

interface PostCardProps {
  post: PostWithAuthor;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const postTypeStyles = {
    ANNOUNCEMENT: 'bg-blue-100 text-blue-800',
    BLOG: 'bg-green-100 text-green-800',
    BOOK: 'bg-purple-100 text-purple-800',
  };

  return (
    <Card className="!p-0 overflow-visible">
        <div className="p-6">
            <div className="flex justify-between items-start">
                <div>
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${postTypeStyles[post.type]}`}>
                        {post.type}
                    </span>
                    <h3 className="mt-2 text-xl font-semibold text-gray-900 hover:text-amber-700 cursor-pointer">
                        {post.title}
                    </h3>
                </div>
                 <div className="flex-shrink-0 ml-4">
                    {/* Placeholder for edit/delete menu */}
                    <button className="text-gray-400 hover:text-gray-600">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                {post.body}
            </p>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3">
                <img className="h-8 w-8 rounded-full" src={post.authorAvatarUrl} alt={post.authorDisplayName} />
                <span className="font-medium text-gray-800">{post.authorDisplayName}</span>
            </div>
            <time dateTime={post.publishedAt.toISOString()} className="text-gray-500">
                {post.publishedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
        </div>
    </Card>
  );
};

export default PostCard;
