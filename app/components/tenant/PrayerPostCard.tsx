import React from 'react';
import type { EnrichedCommunityPost } from '@/types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { CommunityPostType } from '@/types';

interface PrayerPostCardProps {
  post: EnrichedCommunityPost;
}

const PrayerPostCard: React.FC<PrayerPostCardProps> = ({ post }) => {
  const isPrayer = post.type === CommunityPostType.PRAYER_REQUEST;

  const typeStyles = {
    [CommunityPostType.PRAYER_REQUEST]: 'bg-sky-100 text-sky-800',
    [CommunityPostType.TANGIBLE_NEED]: 'bg-lime-100 text-lime-800',
  };

  return (
    <Card className="!p-0 flex flex-col h-full">
      <div className="p-6 flex-grow flex flex-col">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium self-start ${typeStyles[post.type]}`}>
          {post.type.replace('_', ' ')}
        </span>
        <p className="mt-4 text-gray-700 whitespace-pre-wrap flex-grow">{post.body}</p>
      </div>
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <img className="h-8 w-8 rounded-full" src={post.authorAvatarUrl} alt={post.authorDisplayName} />
                <div>
                    <p className="text-sm font-medium text-gray-800">{post.authorDisplayName}</p>
               <p className="text-xs text-gray-500">{(post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt)).toLocaleDateString()}</p>
                </div>
            </div>
            <Button variant="secondary" size="sm">
                {isPrayer ? "I'm Praying" : "I Can Help"}
            </Button>
        </div>
      </div>
    </Card>
  );
};

export default PrayerPostCard;