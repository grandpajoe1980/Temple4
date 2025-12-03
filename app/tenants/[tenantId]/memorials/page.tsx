import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getMembershipForUserInTenant } from '@/lib/data';
import MemorialGalleryPage from '@/app/components/tenant/MemorialGalleryPage';

export default async function Page({ params }: { params: Promise<{ tenantId: string }> }) {
  const session = await getServerSession(authOptions);

  // If user not signed in, still allow viewing gallery but won't be admin
  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);

  if (!tenant) {
    redirect('/');
  }

  let isAdmin = false;
  if (session?.user?.id) {
    const user = await getUserById(session.user.id);
    const membership = await getMembershipForUserInTenant(session.user.id, tenant.id);
    isAdmin = Boolean((user as any)?.isSuperAdmin || membership?.roles?.some((r: any) => r.role === 'ADMIN'));
  }

  return <MemorialGalleryPage isAdmin={isAdmin} />;
}
