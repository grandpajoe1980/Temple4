import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getBooksForTenant } from '@/lib/data';
import { can } from '@/lib/permissions';
import BooksPage from '@/app/components/tenant/BooksPage';

export default async function TenantBooksPage({ params }: { params: Promise<{ tenantId: string }> }) {
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

  const books = await getBooksForTenant(tenant.id);
  const canCreate = await can(user, tenant, 'canCreateBooks');

  return <BooksPage tenant={tenant} user={user} books={books} canCreate={canCreate} />;
}
