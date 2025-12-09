import React from 'react';
import type { EnrichedMediaItem } from '@/types';
import Card from '../ui/Card';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';

function normalizeYoutubeEmbed(url?: string) {
  if (!url) return url;
  try {
    const u = url.trim();
    if (u.includes('/embed/')) return u;
    // youtu.be short link
    const short = /https?:\/\/youtu\.be\/([\w-\-]{11})/i.exec(u);
    if (short && short[1]) return `https://www.youtube.com/embed/${short[1]}`;
    // watch?v= ID in query
    const v = /[?&]v=([\w-\-]{11})/i.exec(u);
    if (v && v[1]) return `https://www.youtube.com/embed/${v[1]}`;
    // fallback: if the URL path ends with an 11-char id
    const pathId = /([\w-\-]{11})(?:\?.*)?$/i.exec(u);
    if (pathId && pathId[1]) return `https://www.youtube.com/embed/${pathId[1]}`;
    return u;
  } catch (err) {
    return url;
  }
}

interface TalkCardProps {
  talk: EnrichedMediaItem;
  canEdit?: boolean;
  onEdit?: (talk: EnrichedMediaItem) => void;
  onDelete?: (talk: EnrichedMediaItem) => void;
}

const TalkCard: React.FC<TalkCardProps> = ({ talk, canEdit = false, onEdit, onDelete }) => {
  return (
    <Card className="relative !p-0 overflow-hidden flex flex-col">
      {canEdit ? (
        <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
          <button onClick={() => onEdit?.(talk)} className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" fill="currentColor"/></svg>
          </button>
          <button onClick={() => onDelete?.(talk)} className="h-9 w-9 rounded-full bg-red-600 text-white flex items-center justify-center" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 7L5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      ) : null}

      <div className="aspect-video w-full">
        <iframe
          src={normalizeYoutubeEmbed(talk.embedUrl)}
          title={talk.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-semibold text-gray-900">{talk.title}</h3>
        <p className="mt-2 text-sm text-gray-600 line-clamp-3">{talk.description}</p>
      </div>
      <div className="bg-gray-50 px-6 py-3 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-3">
          <UserLink userId={(talk as any).authorUserId} className="flex items-center space-x-3">
            <Avatar src={talk.authorAvatarUrl} name={talk.authorDisplayName} size="sm" />
            <span className="font-medium text-gray-800">{talk.authorDisplayName}</span>
          </UserLink>
        </div>
        <time dateTime={talk.publishedAt.toISOString()} className="text-gray-500">
          {talk.publishedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </time>
      </div>
    </Card>
  );
};

export default TalkCard;
