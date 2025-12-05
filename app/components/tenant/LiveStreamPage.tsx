"use client";

import React from 'react';
import ContentChips from './content-chips';
import Card from '../ui/Card';
import CommunityHeader from './CommunityHeader';

interface LiveStreamPageProps {
  tenant: {
    id: string;
    name: string;
    settings: any; // Transformed settings with nested structure
  };
}
function normalizeYoutubeEmbed(url?: string) {
  if (!url) return url;
  try {
    const u = url.trim();
    if (u.includes('/embed/')) return u;
    const short = /https?:\/\/youtu\.be\/([\w-\-]{11})/i.exec(u);
    if (short && short[1]) return `https://www.youtube.com/embed/${short[1]}`;
    const v = /[?&]v=([\w-\-]{11})/i.exec(u);
    if (v && v[1]) return `https://www.youtube.com/embed/${v[1]}`;
    const pathId = /([\w-\-]{11})(?:\?.*)?$/i.exec(u);
    if (pathId && pathId[1]) return `https://www.youtube.com/embed/${pathId[1]}`;
    return u;
  } catch (err) {
    return url;
  }
}

const LiveStreamPage: React.FC<LiveStreamPageProps> = ({ tenant }) => {
  const liveStreamSettings = (tenant.settings as any)?.liveStreamSettings;

  if (!liveStreamSettings?.embedUrl) {
    return (
       <Card>
        <div className="text-center py-12">
            <h2 className="text-xl font-bold text-gray-900">Live Stream Offline</h2>
            <p className="mt-2 text-gray-500">The live stream embed URL has not been configured by an administrator.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <ContentChips tenantId={tenant.id} active="Live Stream" />
      <CommunityHeader
        title={<>Live Stream</>}
        subtitle={<>Join the live service from {tenant.name}.</>}
      />
        <Card className="!p-0 overflow-hidden">
            <div className="aspect-video w-full">
          <iframe
          src={normalizeYoutubeEmbed(liveStreamSettings.embedUrl)}
                title={`${tenant.name} Live Stream`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                ></iframe>
            </div>
        </Card>
    </div>
  );
};

export default LiveStreamPage;
