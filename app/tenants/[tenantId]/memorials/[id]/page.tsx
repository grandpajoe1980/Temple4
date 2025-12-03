import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getMembershipForUserInTenant } from '@/lib/data';
import MemorialDetailPage from '@/app/components/tenant/MemorialDetailPage';

export default async function Page({ params }: { params: Promise<{ tenantId: string; id: string }> }) {
  const session = await getServerSession(authOptions);
  const resolved = await params;
  const tenant = await getTenantById(resolved.tenantId);

  if (!tenant) {
    redirect('/');
  }

  let isAdmin = false;
  if (session?.user?.id) {
    const user = await getUserById(session.user.id);
    const membership = await getMembershipForUserInTenant(session.user.id, tenant.id);
    isAdmin = Boolean((user as any)?.isSuperAdmin || membership?.roles?.some((r: any) => r.role === 'ADMIN'));
  }

  return <MemorialDetailPage isAdmin={isAdmin} />;
}
