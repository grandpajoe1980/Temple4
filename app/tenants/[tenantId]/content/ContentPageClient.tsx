"use client";

import { useEffect } from 'react';
import { useSetPageHeader } from '@/app/components/ui/PageHeaderContext';
import ContentChips from '@/app/components/tenant/content-chips';
import TalkCard from '@/app/components/tenant/SermonCard';
import PodcastCard from '@/app/components/tenant/PodcastCard';
import BookCard from '@/app/components/tenant/BookCard';

type Unified = { kind: 'talk' | 'podcast' | 'book' | 'photo'; item: any; date: Date };

interface ContentPageClientProps {
  tenantId: string;
  tenantName: string;
  unified: Unified[];
}

export default function ContentPageClient({ tenantId, tenantName, unified }: ContentPageClientProps) {
  const setPageHeader = useSetPageHeader();

  useEffect(() => {
    setPageHeader({ title: 'Content' });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  return (
    <div className="space-y-6">
      <ContentChips tenantId={tenantId} active="Content" />

      {unified.length === 0 ? (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Content</h3>
          <p className="mt-1 text-sm text-gray-500">There is no content available for this community.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {unified.map((u) => {
            switch (u.kind) {
              case 'talk':
                return <TalkCard key={`talk-${u.item.id}`} talk={u.item} />;
              case 'podcast':
                return <PodcastCard key={`podcast-${u.item.id}`} podcast={u.item} />;
              case 'book':
                return <BookCard key={`book-${u.item.id}`} post={u.item} />;
              case 'photo': {
                const photoUrl = u.item.storageKey?.startsWith('http') ? u.item.storageKey : `/storage/${u.item.storageKey}`;
                return (
                  <div key={`photo-${u.item.id}`} className="relative rounded bg-white shadow-sm">
                    <a href={photoUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={photoUrl} alt={u.item.title || 'Photo'} className="w-full h-auto max-h-64 object-contain" />
                    </a>
                    <div className="p-2 text-xs text-gray-600">{u.item.authorDisplayName}</div>
                  </div>
                );
              }
              default:
                return null;
            }
          })}
        </div>
      )}
    </div>
  );
}
