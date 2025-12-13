import React from 'react';
import type { EnrichedCommunityPost } from '@/types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';
import { CommunityPostType } from '@/types';
import useTranslation from '@/app/hooks/useTranslation';

interface PrayerPostCardProps {
  post: EnrichedCommunityPost;
}

const PrayerPostCard: React.FC<PrayerPostCardProps> = ({ post }) => {
  const { t, lang } = useTranslation();
  const localeCode = lang === 'vi' ? 'vi-VN' : lang === 'es' ? 'es-ES' : 'en-US';
  const isSupport = post.type === CommunityPostType.SUPPORT_REQUEST;

  const typeStyles = {
    [CommunityPostType.SUPPORT_REQUEST]: 'bg-sky-100 text-sky-800',
    [CommunityPostType.TANGIBLE_NEED]: 'bg-lime-100 text-lime-800',
  };

  const typeLabels: Record<string, string> = {
    [CommunityPostType.SUPPORT_REQUEST]: t('prayerWall.supportRequest'),
    [CommunityPostType.TANGIBLE_NEED]: t('prayerWall.tangibleNeed'),
  };

  return (
    <Card className="!p-0 flex flex-col h-full">
      <div className="p-6 flex-grow flex flex-col">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium self-start ${typeStyles[post.type]}`}>
          {typeLabels[post.type] || post.type.replace('_', ' ')}
        </span>
        <p className="mt-4 text-gray-700 whitespace-pre-wrap flex-grow">{post.body}</p>
      </div>
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <UserLink userId={post.authorUserId} className="flex items-center space-x-3">
              <Avatar src={post.authorAvatarUrl || '/placeholder-avatar.svg'} name={post.authorDisplayName || t('common.anonymous')} size="sm" />
              <div>
                <p className="text-sm font-medium text-gray-800">{post.authorDisplayName}</p>
                <p className="text-xs text-gray-500">{(post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt)).toLocaleDateString(localeCode)}</p>
              </div>
            </UserLink>
          </div>
          <Button variant="secondary" size="sm">
            {isSupport ? t('prayerWall.iSupport') : t('prayerWall.iCanHelp')}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PrayerPostCard;