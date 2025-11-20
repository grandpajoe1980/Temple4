import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { withTenantScope } from '@/lib/tenant-isolation';
import { canUserViewContent } from '@/lib/permissions';
import { EventWithCreator } from '@/types';

export class EventPermissionError extends Error {}

export interface EventResponseDto {
  id: string;
  tenantId: string;
  createdByUserId: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  locationText: string;
  isOnline: boolean;
  onlineUrl: string | null;
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
    description: event.description,
    startDateTime: event.startDateTime.toISOString(),
    endDateTime: event.endDateTime.toISOString(),
    locationText: event.locationText,
    isOnline: event.isOnline,
    onlineUrl: event.onlineUrl ?? null,
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
    description: event.description,
    startDateTime: new Date(event.startDateTime),
    endDateTime: new Date(event.endDateTime),
    locationText: event.locationText,
    isOnline: event.isOnline,
    onlineUrl: event.onlineUrl,
    deletedAt: null,
    creatorDisplayName: event.creatorDisplayName,
    creatorAvatarUrl: event.creatorAvatarUrl,
    rsvpCount: event.rsvpCount,
    currentUserRsvpStatus: event.currentUserRsvpStatus,
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
