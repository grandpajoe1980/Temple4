import React from 'react';
import type { EnrichedMediaItem } from '../../types';
import Card from '../ui/Card';

interface SermonCardProps {
  sermon: EnrichedMediaItem;
}

const SermonCard: React.FC<SermonCardProps> = ({ sermon }) => {
  return (
    <Card className="!p-0 overflow-hidden flex flex-col">
      <div className="aspect-w-16 aspect-h-9">
        <iframe
          src={sermon.embedUrl}
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
