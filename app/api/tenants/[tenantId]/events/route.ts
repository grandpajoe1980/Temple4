import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';

// 10.1 List Events
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from'); // ISO 8601 date string
  const to = searchParams.get('to');     // ISO 8601 date string

  try {
    const canView = await canUserViewContent(userId, resolvedParams.tenantId, 'calendar');
    if (!canView) {
      return NextResponse.json({ message: 'You do not have permission to view events.' }, { status: 403 });
    }

    const events = await prisma.event.findMany({
      where: {
        tenantId: resolvedParams.tenantId,
        deletedAt: null, // Filter out soft-deleted events
        ...(from && to && {
            startDateTime: {
                gte: new Date(from),
                lte: new Date(to),
            },
        }),
      },
      include: {
        _count: {
          select: {
            rsvps: {
              where: {
                status: { in: ['GOING', 'INTERESTED'] }
              }
            }
          }
        }
      },
      orderBy: { startDateTime: 'asc' },
    });

    // Transform to include RSVP counts
    const eventsWithCounts = events.map(event => ({
      ...event,
      rsvpCount: event._count.rsvps,
      _count: undefined, // Remove the _count field from response
    }));

    return NextResponse.json(eventsWithCounts);
  } catch (error) {
    console.error(`Failed to fetch events for tenant ${resolvedParams.tenantId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch events' }, { status: 500 });
  }
}

const eventCreateSchema = z.object({
    title: z.string().min(1),
    description: z.string(),
    startDateTime: z.string().datetime(),
    endDateTime: z.string().datetime(),
    locationText: z.string(),
    isOnline: z.boolean().optional(),
    onlineUrl: z.string().url().optional(),
});

// 10.2 Create Event
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: resolvedParams.tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canCreate = await can(user, tenant, 'canCreateEvents');
    if (!canCreate) {
        return NextResponse.json({ message: 'You do not have permission to create events.' }, { status: 403 });
    }

    const result = eventCreateSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const newEvent = await prisma.event.create({
            data: {
                ...result.data,
                tenantId: resolvedParams.tenantId,
                createdByUserId: userId,
                startDateTime: new Date(result.data.startDateTime),
                endDateTime: new Date(result.data.endDateTime),
            },
        });

        return NextResponse.json(newEvent, { status: 201 });
    } catch (error) {
        console.error(`Failed to create event in tenant ${resolvedParams.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to create event' }, { status: 500 });
    }
}
