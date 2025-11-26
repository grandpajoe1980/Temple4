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
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">Content</h1>
        <p className="text-gray-600 max-w-3xl">Browse photos, podcasts, sermons, books, and live streams for this community.</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-700">Use the main navigation above to jump to the content area you&apos;re interested in.</p>
        </div>
      </div>
    </div>
  );
}

