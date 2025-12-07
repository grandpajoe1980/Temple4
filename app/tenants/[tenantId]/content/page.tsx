import { redirect } from 'next/navigation';
import { getTenantById, getTalksForTenant, getPodcastsForTenant, getBooksForTenant, getPhotosForTenant } from '@/lib/data';
import ContentPageClient from './ContentPageClient';

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

  // Serialize dates for client component
  const serializedUnified = unified.map(u => ({
    ...u,
    date: u.date.toISOString(),
  }));

  return (
    <ContentPageClient
      tenantId={tenant.id}
      tenantName={tenant.name}
      unified={serializedUnified as any}
    />
  );
}

