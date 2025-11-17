import React from 'react';
import type { EnrichedMediaItem } from '../../types';
import Card from '../ui/Card';

interface PodcastCardProps {
  podcast: EnrichedMediaItem;
}

const PodcastCard: React.FC<PodcastCardProps> = ({ podcast }) => {
  // A simple embed for archive.org, might need adjustment for other providers
  const embedUrl = podcast.embedUrl.includes('archive.org') 
    ? podcast.embedUrl.replace('/details/', '/embed/') + '?autoplay=0' 
    : podcast.embedUrl;

  return (
    <Card className="!p-0 overflow-hidden flex flex-col">
      <div className="p-6">
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
