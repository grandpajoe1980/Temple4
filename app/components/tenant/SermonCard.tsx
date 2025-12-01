import React from 'react';
import type { EnrichedMediaItem } from '@/types';
import Card from '../ui/Card';

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

interface SermonCardProps {
  sermon: EnrichedMediaItem;
  canEdit?: boolean;
  onEdit?: (sermon: EnrichedMediaItem) => void;
  onDelete?: (sermon: EnrichedMediaItem) => void;
}

const SermonCard: React.FC<SermonCardProps> = ({ sermon, canEdit = false, onEdit, onDelete }) => {
  return (
    <Card className="relative !p-0 overflow-hidden flex flex-col">
      {canEdit ? (
        <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
          <button onClick={() => onEdit?.(sermon)} className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" fill="currentColor"/></svg>
          </button>
          <button onClick={() => onDelete?.(sermon)} className="h-9 w-9 rounded-full bg-red-600 text-white flex items-center justify-center" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 7L5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      ) : null}

      <div className="aspect-w-16 aspect-h-9">
        <iframe
          src={normalizeYoutubeEmbed(sermon.embedUrl)}
          title={sermon.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-semibold text-gray-900">{sermon.title}</h3>
        <p className="mt-2 text-sm text-gray-600 line-clamp-3">{sermon.description}</p>
      </div>
      <div className="bg-gray-50 px-6 py-3 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-3">
          <img className="h-8 w-8 rounded-full" src={sermon.authorAvatarUrl} alt={sermon.authorDisplayName} />
          <span className="font-medium text-gray-800">{sermon.authorDisplayName}</span>
        </div>
        <time dateTime={sermon.publishedAt.toISOString()} className="text-gray-500">
          {sermon.publishedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </time>
      </div>
    </Card>
  );
};

export default SermonCard;
