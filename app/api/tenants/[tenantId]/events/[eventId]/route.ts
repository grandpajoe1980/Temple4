import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';

// 10.3 Get Single Event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; eventId: string }> }
) {
    const { eventId, tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, tenantId, 'calendar');
    if (!canView) {
      return NextResponse.json({ message: 'You do not have permission to view this event.' }, { status: 403 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId, tenantId: tenantId },
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
    });

    if (!event || event.deletedAt) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    // Transform to include RSVP count
    const eventWithCount = {
      ...event,
      rsvpCount: event._count.rsvps,
      _count: undefined,
    };

    return NextResponse.json(eventWithCount);
  } catch (error) {
    console.error(`Failed to fetch event ${eventId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch event' }, { status: 500 });
  }
}

const eventUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    startDateTime: z.string().datetime().optional(),
    endDateTime: z.string().datetime().optional(),
    locationText: z.string().optional(),
    isOnline: z.boolean().optional(),
    onlineUrl: z.string().url().optional(),
});

// 10.4 Update Event
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; eventId: string }> }
) {
    const { eventId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canUpdate = await can(user, tenant, 'canCreateEvents'); // Assuming same permission for update
    if (!canUpdate) {
        return NextResponse.json({ message: 'You do not have permission to update events.' }, { status: 403 });
    }

    const result = eventUpdateSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const event = await prisma.event.findUnique({ where: { id: eventId, tenantId: tenantId } });
        if (!event || event.deletedAt) {
            return NextResponse.json({ message: 'Event not found' }, { status: 404 });
        }

        // Convert date strings to Date objects
        const updateData: any = { ...result.data };
        if (updateData.startDateTime) {
            updateData.startDateTime = new Date(updateData.startDateTime);
        }
        if (updateData.endDateTime) {
            updateData.endDateTime = new Date(updateData.endDateTime);
        }

        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: updateData,
        });

        return NextResponse.json(updatedEvent);
    } catch (error) {
        console.error(`Failed to update event ${eventId}:`, error);
        return NextResponse.json({ message: 'Failed to update event' }, { status: 500 });
    }
}

// 10.5 Delete Event (Soft Delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; eventId: string }> }
) {
    const { eventId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canDelete = await can(user, tenant, 'canCreateEvents'); // Assuming same permission for delete
    if (!canDelete) {
        return NextResponse.json({ message: 'You do not have permission to delete events.' }, { status: 403 });
    }

    try {
        const event = await prisma.event.findUnique({ where: { id: eventId, tenantId: tenantId } });
        if (!event || event.deletedAt) {
            return NextResponse.json({ message: 'Event not found' }, { status: 404 });
        }

        // Soft delete by setting deletedAt timestamp
        await prisma.event.update({
            where: { id: eventId },
            data: { deletedAt: new Date() },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete event ${eventId}:`, error);
        return NextResponse.json({ message: 'Failed to delete event' }, { status: 500 });
    }
}
