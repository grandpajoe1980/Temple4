import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTenantById, getUserById } from '@/lib/data';
import CalendarPageClient from './CalendarPageClient';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { EventResponseDto, mapEventDtoToClient } from '@/lib/services/event-service';
import type { EnrichedTrip } from '@/types';
import { prisma } from '@/lib/db';

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

  // Pull trips with dates and map them into calendar entries
  const tripsResponse = await fetch(`${baseUrl}/api/tenants/${tenant.id}/trips`, {
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    cache: 'no-store',
  });

  let trips: EnrichedTrip[] = [];
  if (tripsResponse.ok) {
    try {
      const data = await tripsResponse.json();
      trips = Array.isArray(data?.trips) ? data.trips : data;
    } catch {
      trips = [];
    }
  }

  const tripEvents = (trips || [])
    .filter((t) => t.startDate)
    .map((trip) => ({
      id: `trip-${trip.id}`,
      tenantId: trip.tenantId,
      createdByUserId: trip.createdByUserId || '',
      title: `Trip: ${trip.name}`,
      description: trip.summary || trip.description || 'Trip',
      startDateTime: new Date(trip.startDate as any),
      endDateTime: trip.endDate ? new Date(trip.endDate as any) : new Date(trip.startDate as any),
      locationText: trip.destination || trip.meetingPoint || 'Trip',
      isOnline: false,
      onlineUrl: null,
      creatorDisplayName: trip.leader?.profile?.displayName || trip.leader?.email || 'Trip Leader',
      creatorAvatarUrl: trip.leader?.profile?.avatarUrl || null,
      rsvpCount: (trip.members || []).length,
      currentUserRsvpStatus: null,
      kind: 'trip' as const,
      tripId: trip.id,
      isAllDay: false,
    }));

  let birthdayEvents: any[] = [];
  if (tenant.settings?.enableBirthdays) {
    const members = await prisma.userTenantMembership.findMany({
      where: { tenantId: tenant.id, status: 'APPROVED' },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    birthdayEvents = members
      .filter((m: any) => m.user?.profile?.birthDate && m.user?.profile?.isBirthdayPublic)
      .map((m: any) => {
        const birthDate = new Date(m.user.profile.birthDate);
        const start = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        return {
          id: `birthday-${m.user.id}-${currentYear}`,
          tenantId: tenant.id,
          createdByUserId: m.user.id,
          title: `${m.user.profile.displayName || m.user.email || 'Member'}'s Birthday`,
          description: 'Birthday',
          startDateTime: start,
          endDateTime: end,
          locationText: 'Birthday',
          isOnline: false,
          onlineUrl: null,
          creatorDisplayName: m.user.profile.displayName || m.user.email || 'Member',
          creatorAvatarUrl: m.user.profile.avatarUrl || null,
          rsvpCount: 0,
          currentUserRsvpStatus: null,
          kind: 'birthday' as const,
          birthdayUserId: m.user.id,
          isAllDay: true,
        };
      });
  }

  const mergedEvents = [...events, ...tripEvents, ...birthdayEvents] as any;

  const canCreateEvent =
    user.isSuperAdmin ||
    (await hasRole(user.id, tenant.id, [TenantRole.ADMIN, TenantRole.LEADER]));

  return (
    <CalendarPageClient
      events={mergedEvents}
      tenantId={tenant.id}
      canCreateEvent={canCreateEvent}
      currentUserId={user.id}
    />
  );
}
