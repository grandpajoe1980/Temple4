import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getVolunteerNeedsForTenant } from '@/lib/data';
import VolunteeringClient from './VolunteeringClient';

export default async function TenantVolunteeringPage({ params }: { params: Promise<{ tenantId: string }> }) {
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

  const needs = await getVolunteerNeedsForTenant(tenant.id);

  return <VolunteeringClient tenant={tenant} user={user} needs={needs} />;
}
