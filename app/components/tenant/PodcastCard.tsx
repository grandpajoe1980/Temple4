import React from 'react';
import type { EnrichedMediaItem } from '@/types';
import Card from '../ui/Card';
import PodcastEmbed from '@/app/components/PodcastEmbed';

interface PodcastCardProps {
  podcast: EnrichedMediaItem;
  canEdit?: boolean;
  onEdit?: (podcast: EnrichedMediaItem) => void;
  onDelete?: (podcast: EnrichedMediaItem) => void;
  onPlay?: (podcast: EnrichedMediaItem) => void;
  expanded?: boolean;
}

const PodcastCard: React.FC<PodcastCardProps> = ({ podcast, canEdit = false, onEdit, onDelete, onPlay, expanded = false }) => {
  // A simple embed for archive.org, might need adjustment for other providers
  const embedUrl = podcast.embedUrl.includes('archive.org') 
    ? podcast.embedUrl.replace('/details/', '/embed/') + '?autoplay=0' 
    : podcast.embedUrl;

  return (
    <Card className="relative !p-0 overflow-hidden flex flex-col">
      {/** action buttons */}
      {canEdit ? (
        <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
          <button onClick={() => onPlay?.(podcast)} className="h-9 w-9 rounded-full bg-green-500 text-white flex items-center justify-center" title="Play">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3v18l15-9L5 3z" fill="currentColor"/></svg>
          </button>
          <button onClick={() => onEdit?.(podcast)} className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" fill="currentColor"/></svg>
          </button>
          <button onClick={() => onDelete?.(podcast)} className="h-9 w-9 rounded-full bg-red-600 text-white flex items-center justify-center" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 7L5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      ) : null}
      <div className="p-6">
        {expanded ? (
          <div>
            <PodcastEmbed url={podcast.embedUrl} />
          </div>
        ) : (
          podcast.artworkUrl ? (
            <div className="w-full h-40 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
              <img src={podcast.artworkUrl} alt={podcast.title} className="object-cover w-full h-full" />
            </div>
          ) : (
            <iframe
              src={embedUrl}
              width="100%"
              height="40"
              frameBorder="0"
              allowFullScreen={false}
              allow="autoplay; clipboard-write; encrypted-media;"
              title={podcast.title}
              className="rounded-md"
            ></iframe>
          )
        )}
      </div>
      <div className="p-6 pt-2 flex-grow">
        <h3 className="text-xl font-semibold text-gray-900">{podcast.title}</h3>
        <p className="mt-2 text-sm text-gray-600 line-clamp-3">{podcast.description}</p>
      </div>
      <div className="bg-gray-50 px-6 py-3 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-3">
          <img className="h-8 w-8 rounded-full" src={podcast.authorAvatarUrl} alt={podcast.authorDisplayName} />
          <span className="font-medium text-gray-800">{podcast.authorDisplayName}</span>
        </div>
        <time dateTime={podcast.publishedAt.toISOString()} className="text-gray-500">
          {podcast.publishedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </time>
      </div>
    </Card>
  );
};

export default PodcastCard;
