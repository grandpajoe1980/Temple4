import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { getTenantsForUser } from '@/lib/data';
import TenantsPageClient from './TenantsPageClient';

export const dynamic = 'force-dynamic';

export default async function TenantsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;

  const [memberTenants, allTenants] = await Promise.all([
    userId ? getTenantsForUser(userId) : Promise.resolve([]),
    prisma.tenant.findMany({
      include: {
        settings: true,
        branding: true,
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <TenantsPageClient isAuthenticated={Boolean(userId)} memberTenants={memberTenants as any} allTenants={allTenants as any} />
  );
}
