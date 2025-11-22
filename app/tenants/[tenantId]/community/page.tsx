import { redirect } from 'next/navigation';
import { getTenantById } from '@/lib/data';
import CommunityChips from '@/app/components/tenant/CommunityChips';

export default async function TenantCommunityPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);

  if (!tenant) {
    redirect('/');
  }

  return (
    <div className="space-y-8">
      <CommunityChips tenantId={tenant.id} />

      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">Community</h1>
        <p className="text-gray-600 max-w-3xl">Quickly navigate community areas: posts, events, prayer wall, members, chat, groups, volunteering and resources.</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-700">Use the chips above to jump to the community area you're interested in.</p>
        </div>
      </div>
    </div>
  );
}
