import { redirect } from 'next/navigation';
import { getTenantById, getTalksForTenant, getPodcastsForTenant, getBooksForTenant, getPhotosForTenant } from '@/lib/data';
import ContentChips from '@/app/components/tenant/content-chips';
import CommunityHeader from '@/app/components/tenant/CommunityHeader';
import TalkCard from '@/app/components/tenant/SermonCard';
import PodcastCard from '@/app/components/tenant/PodcastCard';
import BookCard from '@/app/components/tenant/BookCard';

export default async function TenantContentPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);

  if (!tenant) {
    redirect('/');
  }

  // Fetch content from various sources
  const [talks, podcasts, books, photos] = await Promise.all([
    getTalksForTenant(tenant.id).catch(() => []),
    getPodcastsForTenant(tenant.id).catch(() => []),
    getBooksForTenant(tenant.id).catch(() => []),
    getPhotosForTenant(tenant.id).catch(() => []),
  ]);

  // Normalize and merge into a single list with a unified `date` field
  type Unified = { kind: 'talk' | 'podcast' | 'book' | 'photo'; item: any; date: Date };

  const unified: Unified[] = [];

  talks.forEach((s: any) => {
    unified.push({ kind: 'talk', item: s, date: s.publishedAt ? new Date(s.publishedAt) : new Date() });
  });

  podcasts.forEach((p: any) => {
    unified.push({ kind: 'podcast', item: p, date: p.publishedAt ? new Date(p.publishedAt) : new Date() });
  });

  books.forEach((b: any) => {
    unified.push({ kind: 'book', item: b, date: b.publishedAt ? new Date(b.publishedAt) : new Date() });
  });

  photos.forEach((ph: any) => {
    // photos use uploadedAt
    const d = ph.uploadedAt ? new Date(ph.uploadedAt) : ph.publishedAt ? new Date(ph.publishedAt) : new Date();
    unified.push({ kind: 'photo', item: ph, date: d });
  });

  // Sort newest first
  unified.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">Content</h1>
        <p className="text-gray-600 max-w-3xl">Browse photos, podcasts, talks, and books for this community.</p>
      </div>

      <div className="space-y-6">
        <ContentChips tenantId={tenant.id} active="Content" />
        <CommunityHeader title={<>All Content</>} subtitle={<>Combined feed of recent content for {tenant.name}.</>} />

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
    </div>
  );
}

