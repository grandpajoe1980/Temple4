import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';
import { handleApiError, unauthorized, forbidden, notFound, validationError } from '@/lib/api-response';

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
      return forbidden('You do not have permission to view this event.');
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
      return notFound('Event');
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
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/events/[eventId]', tenantId, eventId });
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
      return unauthorized();
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
      return validationError({ tenant: ['Invalid user or tenant'] });
    }

    const canUpdate = await can(user, tenant, 'canCreateEvents'); // Assuming same permission for update
    if (!canUpdate) {
      return forbidden('You do not have permission to update events.');
    }

    const result = eventUpdateSchema.safeParse(await request.json());
    if (!result.success) {
      return validationError(result.error.flatten().fieldErrors);
    }

    try {
        const event = await prisma.event.findUnique({ where: { id: eventId, tenantId: tenantId } });
        if (!event || event.deletedAt) {
          return notFound('Event');
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
      return handleApiError(error, { route: 'PATCH /api/tenants/[tenantId]/events/[eventId]', tenantId, eventId });
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
      return unauthorized();
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
      return validationError({ tenant: ['Invalid user or tenant'] });
    }

    const canDelete = await can(user, tenant, 'canCreateEvents'); // Assuming same permission for delete
    if (!canDelete) {
      return forbidden('You do not have permission to delete events.');
    }

    try {
        const event = await prisma.event.findUnique({ where: { id: eventId, tenantId: tenantId } });
        if (!event || event.deletedAt) {
          return notFound('Event');
        }

        // Soft delete by setting deletedAt timestamp
        await prisma.event.update({
            where: { id: eventId },
            data: { deletedAt: new Date() },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error(`Failed to delete event ${eventId}:`, error);
      return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/events/[eventId]', tenantId, eventId });
    }
}
