import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTenantById, getUserById, getEventsForTenant } from '@/lib/data';
import EventsCalendar from '@/app/components/tenant/EventsCalendar';

export default async function TenantCalendarPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);
  const user = await getUserById((session.user as any).id);

  if (!tenant || !user) {
    redirect('/');
  }

  const events = await getEventsForTenant(tenant.id);

  return <div>
    <EventsCalendar events={events} onDateClick={(date) => {/* TODO: Implement */}} />
  </div>;
}
