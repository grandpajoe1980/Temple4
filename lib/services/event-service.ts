import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { withTenantScope } from '@/lib/tenant-isolation';
import { canUserViewContent } from '@/lib/permissions';
import { EventWithCreator } from '@/types';
import { enqueueOutbox } from '@/lib/outbox';

export class EventPermissionError extends Error { }

export interface EventResponseDto {
  id: string;
  tenantId: string;
  createdByUserId: string;
  title: string;
  description?: string | null;
  startDateTime: string;
  endDateTime?: string | null;
  locationText?: string | null;
  isOnline: boolean;
  onlineUrl: string | null;
  posterStorageKey?: string | null;
  posterUrl?: string | null;
  creatorDisplayName: string;
  creatorAvatarUrl: string | null;
  rsvpCount: number;
  currentUserRsvpStatus: string | null;
}

type EventRecord = Prisma.EventGetPayload<{
  include: {
    creator: { include: { profile: true } };
    _count: { select: { rsvps: { where: { status: { in: ['GOING', 'INTERESTED'] } } } } };
    rsvps?: { where: { userId: string }; select: { status: true } };
  };
}>;

export function mapEventToResponseDto(event: EventRecord): EventResponseDto {
  return {
    id: event.id,
    tenantId: event.tenantId,
    createdByUserId: event.createdByUserId,
    title: event.title,
    description: event.description ?? '',
    startDateTime: event.startDateTime.toISOString(),
    endDateTime: event.endDateTime ? event.endDateTime.toISOString() : event.startDateTime.toISOString(),
    locationText: event.locationText ?? '',
    isOnline: event.isOnline,
    onlineUrl: event.onlineUrl ?? null,
    posterStorageKey: event.posterStorageKey ?? null,
    posterUrl: event.posterUrl ?? null,
    creatorDisplayName: event.creator.profile?.displayName || event.creator.email,
    creatorAvatarUrl: event.creator.profile?.avatarUrl || null,
    rsvpCount: event._count?.rsvps ?? 0,
    currentUserRsvpStatus: (event as any).rsvps?.[0]?.status ?? null,
  };
}

export function mapEventDtoToClient(event: EventResponseDto): EventWithCreator {
  return {
    id: event.id,
    tenantId: event.tenantId,
    createdByUserId: event.createdByUserId,
    title: event.title,
    description: event.description ?? '',
    startDateTime: new Date(event.startDateTime),
    endDateTime: new Date(event.endDateTime ?? event.startDateTime),
    locationText: event.locationText ?? '',
    posterStorageKey: event.posterStorageKey ?? null,
    posterUrl: event.posterUrl ?? null,
    isOnline: event.isOnline,
    onlineUrl: event.onlineUrl,
    deletedAt: null,
    creatorDisplayName: event.creatorDisplayName,
    creatorAvatarUrl: event.creatorAvatarUrl,
    rsvpCount: event.rsvpCount,
    currentUserRsvpStatus: event.currentUserRsvpStatus as any,
  };
}

export async function listTenantEvents(options: {
  tenantId: string;
  viewerUserId?: string | null;
  from?: string | null;
  to?: string | null;
}): Promise<EventResponseDto[]> {
  const { tenantId, viewerUserId, from, to } = options;

  const canView = await canUserViewContent(viewerUserId ?? null, tenantId, 'calendar');
  if (!canView) {
    throw new EventPermissionError('You do not have permission to view events.');
  }

  const whereClause: Prisma.EventWhereInput = withTenantScope(
    {
      deletedAt: null,
      ...(from && to
        ? {
          startDateTime: {
            gte: new Date(from),
            lte: new Date(to),
          },
        }
        : {}),
    },
    tenantId,
    'Event'
  );

  const events = await prisma.event.findMany({
    where: whereClause,
    include: {
      creator: {
        include: {
          profile: true,
        },
      },
      _count: {
        select: {
          rsvps: {
            where: {
              status: { in: ['GOING', 'INTERESTED'] },
            },
          },
        },
      },
      ...(viewerUserId
        ? {
          rsvps: {
            where: { userId: viewerUserId },
            select: { status: true },
          },
        }
        : {}),
    },
    orderBy: { startDateTime: 'asc' },
  });

  return events.map((event) => mapEventToResponseDto(event));
}

// Basic create helper — service layer for event creation
export async function createEvent(input: any) {
  const data: any = { ...input };
  if (data.startDateTime && typeof data.startDateTime === 'string') data.startDateTime = new Date(data.startDateTime);
  if (data.endDateTime && typeof data.endDateTime === 'string') data.endDateTime = new Date(data.endDateTime);

  if (data.volunteerRoles && Array.isArray(data.volunteerRoles)) {
    data.volunteerRoles = {
      create: data.volunteerRoles
    };
  }

  const ev = await prisma.event.create({ data });

  // If event is published immediately, optionally enqueue a notification
  try {
    if (ev.status === 'PUBLISHED') {
      // enqueue a simple announcement-type payload. type is nullable in Outbox table.
      enqueueOutbox(ev.tenantId, {
        subject: `New event published: ${ev.title}`,
        text: `An event "${ev.title}" was published.`,
        html: `<p>An event <strong>${ev.title}</strong> was published.</p>`,
        eventId: ev.id,
      }, null);
    }
  } catch (e) {
    // swallow errors
  }
  return ev;
}

export async function getEventById(tenantId: string, eventId: string) {
  const ev = await prisma.event.findUnique({ where: { id: eventId }, include: { creator: { include: { profile: true } }, _count: { select: { rsvps: true } } } });
  if (!ev || ev.deletedAt || ev.tenantId !== tenantId) return null;
  return ev;
}

export async function updateEvent(tenantId: string, eventId: string, updates: any) {
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing || existing.deletedAt || existing.tenantId !== tenantId) throw new Error('Event not found');

  if (updates.startDateTime && typeof updates.startDateTime === 'string') updates.startDateTime = new Date(updates.startDateTime);
  if (updates.endDateTime && typeof updates.endDateTime === 'string') updates.endDateTime = new Date(updates.endDateTime);

  const updated = await prisma.event.update({ where: { id: eventId }, data: updates });

  // If callers requested notifyAttendees, enqueue notification emails to attendees
  try {
    if (updates.notifyAttendees) {
      // fetch attendees (GOING and WAITLISTED)
      const attendees = await prisma.eventRSVP.findMany({ where: { eventId, status: { in: ['GOING', 'WAITLISTED'] } }, include: { user: { select: { email: true, profile: true } } } });
      for (const a of attendees) {
        const to = a.user ? a.user.email : a.guestEmail;
        if (!to) continue;
        const subject = `Update: ${updated.title}`;
        const text = `The event \"${updated.title}\" has been updated. Please check the event page for details.`;
        const html = `<p>The event <strong>${updated.title}</strong> has been updated. Please check the event page for details.</p>`;
        // enqueue per-attendee to allow per-recipient personalization later
        enqueueOutbox(tenantId, { to, subject, text, html, eventId: updated.id }, null);
      }
    }
  } catch (e) {
    // ignore failures to enqueue
  }
  return updated;
}

export async function softDeleteEvent(tenantId: string, eventId: string) {
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing || existing.deletedAt || existing.tenantId !== tenantId) throw new Error('Event not found');
  return prisma.event.update({ where: { id: eventId }, data: { deletedAt: new Date() } });
}

// Create or update RSVP. For authenticated users, we identify by userId, for guests by guestEmail.
export async function rsvpToEvent(tenantId: string, eventId: string, input: any) {
  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  if (!ev || ev.deletedAt || ev.tenantId !== tenantId) throw new Error('Event not found');

  // Normalize requested status
  const requestedStatus: string = (input.status || 'GOING') as string;

  // Enforce registration window if configured
  const now = new Date();
  if (ev.registrationRequired) {
    if (ev.registrationOpenAt && now < ev.registrationOpenAt) {
      throw new Error('RegistrationNotOpen');
    }
    if (ev.registrationCloseAt && now > ev.registrationCloseAt) {
      throw new Error('RegistrationClosed');
    }
  }

  // Count current GOING attendees
  const goingCount = await prisma.eventRSVP.count({ where: { eventId, status: 'GOING' } });

  // Helper to determine if a new GOING should be waitlisted
  const shouldBeWaitlisted = (status: string) => {
    if (status !== 'GOING') return false;
    if (!ev.capacityLimit) return false;
    return goingCount >= ev.capacityLimit;
  };

  // If this is an authenticated user
  if (input.userId) {
    const existing = await prisma.eventRSVP.findFirst({ where: { userId: input.userId, eventId } }).catch(() => null);
    if (existing) {
      // Updating existing RSVP: if requesting GOING but capacity full, and waitlist enabled, mark WAITLISTED
      const newStatus = shouldBeWaitlisted(requestedStatus) && ev.waitlistEnabled ? 'WAITLISTED' : requestedStatus;
      // If volunteerRoleId provided, validate capacity for that role
      if (input.volunteerRoleId) {
        const role = await prisma.eventVolunteerRole.findUnique({ where: { id: input.volunteerRoleId } });
        if (!role || role.eventId !== eventId) throw new Error('Invalid volunteer role');
        const taken = await prisma.eventRSVP.count({ where: { volunteerRoleId: input.volunteerRoleId, status: 'GOING' } });
        if (taken >= role.capacity) throw new Error('Volunteer role full');
        return prisma.eventRSVP.update({ where: { id: existing.id }, data: ({ status: newStatus, role: 'VOLUNTEER', notes: input.notes, volunteerRoleId: input.volunteerRoleId } as any) });
      }
      return prisma.eventRSVP.update({ where: { id: existing.id }, data: ({ status: newStatus, role: input.role, notes: input.notes } as any) });
    }
  }

  // Guest (by email) existing check
  if (!input.userId && input.guestEmail) {
    const existing = await prisma.eventRSVP.findFirst({ where: { guestEmail: input.guestEmail, eventId } }).catch(() => null);
    if (existing) {
      const newStatus = shouldBeWaitlisted(requestedStatus) && ev.waitlistEnabled ? 'WAITLISTED' : requestedStatus;
      if (input.volunteerRoleId) {
        const role = await prisma.eventVolunteerRole.findUnique({ where: { id: input.volunteerRoleId } });
        if (!role || role.eventId !== eventId) throw new Error('Invalid volunteer role');
        const taken = await prisma.eventRSVP.count({ where: { volunteerRoleId: input.volunteerRoleId, status: 'GOING' } });
        if (taken >= role.capacity) throw new Error('Volunteer role full');
        return prisma.eventRSVP.update({ where: { id: existing.id }, data: ({ status: newStatus, role: 'VOLUNTEER', notes: input.notes, guestName: input.guestName, volunteerRoleId: input.volunteerRoleId } as any) });
      }
      return prisma.eventRSVP.update({ where: { id: existing.id }, data: ({ status: newStatus, role: input.role, notes: input.notes, guestName: input.guestName } as any) });
    }
  }

  // Prepare create payload
  const createStatus = shouldBeWaitlisted(requestedStatus) && ev.waitlistEnabled ? 'WAITLISTED' : requestedStatus;

  // If capacity reached and waitlist disabled and user requests GOING, throw error
  if (shouldBeWaitlisted(requestedStatus) && !ev.waitlistEnabled) {
    throw new Error('Event is full');
  }

  const data: any = {
    eventId,
    userId: input.userId ?? null,
    guestName: input.guestName ?? null,
    guestEmail: input.guestEmail ?? null,
    status: createStatus,
    role: input.volunteerRoleId ? 'VOLUNTEER' : (input.role || 'ATTENDEE'),
    volunteerRoleId: input.volunteerRoleId ?? null,
    notes: input.notes,
  };

  // If signing up for a volunteer role, validate role capacity before creating
  if (input.volunteerRoleId) {
    const role = await prisma.eventVolunteerRole.findUnique({ where: { id: input.volunteerRoleId } });
    if (!role || role.eventId !== eventId) throw new Error('Invalid volunteer role');
    const taken = await prisma.eventRSVP.count({ where: { volunteerRoleId: input.volunteerRoleId, status: 'GOING' } });
    if (taken >= role.capacity) throw new Error('Volunteer role full');
  }

  const created = await prisma.eventRSVP.create({ data: (data as any) });
  return created;
}

export async function getEventAttendees(tenantId: string, eventId: string) {
  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  if (!ev || ev.deletedAt || ev.tenantId !== tenantId) throw new Error('Event not found');
  return prisma.eventRSVP.findMany({ where: { eventId }, include: { user: { select: { id: true, profile: true, email: true } } } });
}

// Promote a waitlisted RSVP to GOING. If `force` is true, override capacity limits.
export async function promoteWaitlisted(tenantId: string, eventId: string, rsvpId: string, options?: { force?: boolean }) {
  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  if (!ev || ev.deletedAt || ev.tenantId !== tenantId) throw new Error('Event not found');

  const rsvp = await prisma.eventRSVP.findUnique({ where: { id: rsvpId } });
  if (!rsvp) throw new Error('RSVP not found');
  if (rsvp.eventId !== eventId) throw new Error('RSVP does not belong to this event');
  if (rsvp.status !== 'WAITLISTED') throw new Error('RSVP is not waitlisted');

  // Count current GOING attendees
  const goingCount = await prisma.eventRSVP.count({ where: { eventId, status: 'GOING' } });

  if (!options?.force && ev.capacityLimit && goingCount >= ev.capacityLimit) {
    throw new Error('Event is full');
  }

  const updated = await prisma.eventRSVP.update({ where: { id: rsvpId }, data: { status: 'GOING' } as any });

  // Enqueue notification to promoted attendee
  try {
    const to = rsvp.userId ? (await prisma.user.findUnique({ where: { id: rsvp.userId } }))?.email : rsvp.guestEmail;
    if (to) {
      enqueueOutbox(tenantId, {
        to,
        subject: `You're off the waitlist for ${ev.title}`,
        text: `A spot opened up for ${ev.title} and you've been moved from the waitlist to Going.`,
        html: `<p>A spot opened up for <strong>${ev.title}</strong> and you've been moved from the waitlist to <strong>Going</strong>.</p>`,
        eventId: ev.id,
      }, null);
    }
  } catch (e) {
    // ignore enqueue failures
  }

  return updated;
}

