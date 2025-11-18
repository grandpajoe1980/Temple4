import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]/route';
import { getTenantsForUser } from '@/lib/data';
import HomePageClient from './components/HomePageClient';
import { prisma } from '@/lib/db';

export default async function Page() {
  const session = await getServerSession(authOptions);

  const userId = (session?.user as any)?.id;
  let tenants: any[] = [];
  if (userId) {
    tenants = await getTenantsForUser(userId);
  }
  const allTenants = await prisma.tenant.findMany();

  return <HomePageClient session={session} tenants={tenants} allTenants={allTenants} />;
}
