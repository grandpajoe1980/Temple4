import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTenantById } from '@/lib/data';

export default async function TenantContentPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);

  if (!tenant) {
    redirect('/');
  }

  return (
    <div className="space-y-8">
      <div className="sticky top-[4.5rem] z-10 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap gap-3">
            <ContentChip href={`/tenants/${tenant.id}/photos`} label="Photos" />
            <ContentChip href={`/tenants/${tenant.id}/podcasts`} label="Podcasts" />
            <ContentChip href={`/tenants/${tenant.id}/sermons`} label="Sermons" />
            <ContentChip href={`/tenants/${tenant.id}/books`} label="Books" />
            <ContentChip href={`/tenants/${tenant.id}/livestream`} label="Live Stream" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">Content</h1>
        <p className="text-gray-600 max-w-3xl">Browse photos, podcasts, sermons, books, and live streams for this community.</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-700">Use the chips above to jump to the content area you're interested in.</p>
        </div>
      </div>
    </div>
  );
}

function ContentChip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-sm transition-colors border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700`}
    >
      {label}
    </Link>
  );
}
