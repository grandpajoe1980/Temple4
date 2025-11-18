import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById } from '@/lib/data';
import LiveStreamPage from '@/app/components/tenant/LiveStreamPage';

export default async function TenantLiveStreamPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);

  if (!tenant) {
    redirect('/');
  }

  return <LiveStreamPage tenant={tenant} />;
}
