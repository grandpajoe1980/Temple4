import { getServerSession } from 'next-auth/next';
import { Prisma } from '@prisma/client';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { getTenantsForUser } from '@/lib/data';
import TenantsPageClient from './TenantsPageClient';

export const dynamic = 'force-dynamic';

export default async function TenantsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const tenantInclude = Prisma.validator<Prisma.TenantInclude>()({
    settings: true,
    branding: true,
  });

  const [memberTenants, allTenants] = await Promise.all([
    userId ? getTenantsForUser(userId) : Promise.resolve([]),
    prisma.tenant.findMany({
      include: tenantInclude,
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <TenantsPageClient isAuthenticated={Boolean(userId)} memberTenants={memberTenants} allTenants={allTenants} />
  );
}
