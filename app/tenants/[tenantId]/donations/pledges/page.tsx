import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById } from '@/lib/data';
import PledgesPage from '@/app/components/tenant/PledgesPage';

export default async function TenantPledgesPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);
  const user = await getUserById(session.user.id);

  if (!tenant || !user) {
    redirect('/');
  }

  const safeUser = {
    id: user.id,
    profile: user.profile ?? { displayName: user.email },
  };

  return <PledgesPage tenant={tenant} user={safeUser} />;
}
