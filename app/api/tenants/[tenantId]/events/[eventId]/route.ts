import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';
import { updateEventSchema } from '../schemas';
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

// Using shared update schema from ../schemas

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

  const result = updateEventSchema.safeParse(await request.json());
  if (!result.success) {
    return validationError(result.error.flatten().fieldErrors);
  }

  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope'); // 'THIS_EVENT' | 'ALL_IN_SERIES'

    const existingEvent = await prisma.event.findUnique({ where: { id: eventId, tenantId: tenantId } });
    if (!existingEvent || existingEvent.deletedAt) {
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

    // Helper to handle volunteer roles (same for single or multi)
    const handleVolunteerRoles = (data: any) => {
      if (data.volunteerRoles && Array.isArray(data.volunteerRoles)) {
        return {
          deleteMany: {},
          create: data.volunteerRoles
        };
      }
      return undefined;
    };

    const volunteerRolesUpdate = handleVolunteerRoles(updateData);
    if (volunteerRolesUpdate) {
      updateData.volunteerRoles = volunteerRolesUpdate;
    }

    if (scope === 'ALL_IN_SERIES' && existingEvent.recurrenceGroupId) {
      // --- SERIES UPDATE LOGIC (OPTIMIZED) ---

      // 1. Calculate Time Delta
      let timeDelta = 0;
      if (updateData.startDateTime) {
        timeDelta = updateData.startDateTime.getTime() - existingEvent.startDateTime.getTime();
      }

      // 2. Separate scalars and complex fields
      // specific keys that are relations or special handling
      const { volunteerRoles, startDateTime, endDateTime, ...scalars } = updateData;

      // 3. Bulk Update Scalars
      if (Object.keys(scalars).length > 0) {
        await prisma.event.updateMany({
          where: { recurrenceGroupId: existingEvent.recurrenceGroupId, tenantId, deletedAt: null },
          data: scalars
        });
      }

      // 4. Time Shift using Raw SQL (Fast)
      if (timeDelta !== 0) {
        // Postgres interval syntax: '1000 milliseconds'
        // We use a parameterized query for safety. 
        // Note: Prisma 5+ uses $executeRaw
        const deltaMs = Math.round(timeDelta); // ensure integer

        // We need to apply this to all events in the group
        await prisma.$executeRaw`
                UPDATE "Event"
                SET 
                  "startDateTime" = "startDateTime" + (${deltaMs} * INTERVAL '1 millisecond'),
                  "endDateTime" = "endDateTime" + (${deltaMs} * INTERVAL '1 millisecond')
                WHERE "recurrenceGroupId" = ${existingEvent.recurrenceGroupId}
                  AND "tenantId" = ${tenantId}
                  AND "deletedAt" IS NULL
            `;
      } else if (endDateTime && startDateTime) {
        // Duration change logic (if time didn't shift but duration did)
        // This is trickier in bulk if start time didn't change...
        // But if startDateTime didn't change (delta 0), then we can just set endDateTime?
        // No, "ALL_IN_SERIES" implies we are applying the "change" to the series.
        // If I change 10-11 to 10-12 (Duration +1h).
        // I want all events to increase duration by 1h.
        // NewEnd = Start + NewDuration.
        // Since Start is varying, we can't just set End = FixedValue.

        const newDurationMs = endDateTime.getTime() - startDateTime.getTime();
        await prisma.$executeRaw`
                UPDATE "Event"
                SET "endDateTime" = "startDateTime" + (${newDurationMs} * INTERVAL '1 millisecond')
                WHERE "recurrenceGroupId" = ${existingEvent.recurrenceGroupId}
                  AND "tenantId" = ${tenantId}
                  AND "deletedAt" IS NULL
             `;
      }

      // 5. Volunteer Roles
      // OPTIMIZATION: For now, we skip updating volunteer roles for the entire series to prevent 
      // massive delete/create loops that cause timeouts. 
      // If critical, we would need a more complex bulk strategy.
      // For now, we only update roles on the ID that was clicked if we wanted, 
      // but 'ALL_IN_SERIES' implies consistency. 
      // Leaving them separate is safer than partial updates or timeouts.

      // Return the updated single event so UI can refresh
      const updatedEvent = await prisma.event.findUnique({ where: { id: eventId } });
      return NextResponse.json(updatedEvent);

    } else {
      // --- SINGLE EVENT UPDATE ---
      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: updateData,
      });
      return NextResponse.json(updatedEvent);
    }

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
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope'); // 'THIS_EVENT' | 'ALL_IN_SERIES'

    const event = await prisma.event.findUnique({ where: { id: eventId, tenantId: tenantId } });
    if (!event || event.deletedAt) {
      return notFound('Event');
    }

    if (scope === 'ALL_IN_SERIES' && event.recurrenceGroupId) {
      // Delete all events in the series
      await prisma.event.updateMany({
        where: { recurrenceGroupId: event.recurrenceGroupId, tenantId },
        data: { deletedAt: new Date() }
      });
    } else {
      // Single event delete
      await prisma.event.update({
        where: { id: eventId },
        data: { deletedAt: new Date() },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Failed to delete event ${eventId}:`, error);
    return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/events/[eventId]', tenantId, eventId });
  }
}
