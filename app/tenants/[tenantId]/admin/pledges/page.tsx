import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import AdminPledgesPage from '@/app/components/tenant/AdminPledgesPage';

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function PledgesAdminPage({ params }: PageProps) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect(`/tenants/${tenantId}/auth/signin`);
  }

  // Check if user is admin or owner
  const membership = await prisma.userTenantMembership.findFirst({
    where: {
      tenantId,
      userId: session.user.id,
      roles: { some: { role: { in: ['ADMIN'] } } },
    },
  });

  if (!membership) {
    redirect(`/tenants/${tenantId}`);
  }

  // Check if feature is enabled
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { settings: true },
  });

  if (!tenant?.settings?.enableRecurringPledges) {
    redirect(`/tenants/${tenantId}/admin`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminPledgesPage tenantId={tenantId} />
    </div>
  );
}
