import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]/route';
import { getTenantsForUser } from '@/lib/data';
import HomePageClient from './components/HomePageClient';
import { prisma } from '@/lib/db';
import type { TenantWithBrandingAndSettings } from '@/lib/data';

export default async function Page() {
  const session = await getServerSession(authOptions);

  const userId = session?.user?.id;
  let tenants: TenantWithBrandingAndSettings[] = [];
  if (userId) {
    tenants = await getTenantsForUser(userId);
  }
  const allTenants: TenantWithBrandingAndSettings[] = await prisma.tenant.findMany({
    include: {
      settings: true,
      branding: true,
    },
  });

  return <HomePageClient session={session} tenants={tenants} allTenants={allTenants} />;
}
