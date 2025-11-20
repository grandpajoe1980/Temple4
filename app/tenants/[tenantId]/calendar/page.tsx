import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTenantById, getUserById } from '@/lib/data';
import CalendarPageClient from './CalendarPageClient';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { EventResponseDto, mapEventDtoToClient } from '@/lib/services/event-service';

export default async function TenantCalendarPage({ params }: { params: Promise<{ tenantId: string }> }) {
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

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  let cookieHeader = '';
  try {
    const cookieStore = await cookies();
    const all = (cookieStore as any).getAll ? (cookieStore as any).getAll() : [];
    cookieHeader = Array.isArray(all) ? all.map((c: any) => `${c.name}=${c.value}`).join('; ') : (cookieStore?.toString?.() || '');
  } catch (e) {
    cookieHeader = '';
  }

  const eventsResponse = await fetch(`${baseUrl}/api/tenants/${tenant.id}/events`, {
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    cache: 'no-store',
  });

  const eventDtos: EventResponseDto[] = eventsResponse.ok ? await eventsResponse.json() : [];
  const events = eventDtos.map(mapEventDtoToClient);
  const canCreateEvent =
    user.isSuperAdmin ||
    (await hasRole(user.id, tenant.id, [TenantRole.ADMIN, TenantRole.CLERGY]));

  return (
    <CalendarPageClient
      events={events}
      tenantId={tenant.id}
      canCreateEvent={canCreateEvent}
      currentUserId={user.id}
    />
  );
}
