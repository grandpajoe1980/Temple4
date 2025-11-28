import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { can, canUserViewContent } from '@/lib/permissions';
import { z } from 'zod';
import { rsvpSchema } from '../../schemas';
import { RSVPStatus } from '@/types';
import { unauthorized, forbidden, validationError, handleApiError } from '@/lib/api-response';
import { rsvpToEvent } from '@/lib/services/event-service';

// 10.6 List Event RSVPs
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; eventId: string }> }
) {
    const { eventId, tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return unauthorized();
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
      return validationError({ request: ['Invalid user or tenant'] });
    }

    // Only event creators or admins/staff can see the full RSVP list
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    const canManage = await can(user, tenant, 'canCreateEvents'); // Assuming this permission level
    
    if (event?.createdByUserId !== userId && !canManage) {
      return forbidden('Forbidden');
    }

    const rsvps = await prisma.eventRSVP.findMany({
      where: { eventId: eventId },
      include: {
        user: {
          select: {
            id: true,
            profile: true,
          },
        },
      },
    });

    return NextResponse.json(rsvps);
  } catch (error) {
    console.error(`Failed to fetch RSVPs for event ${eventId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/events/[eventId]/rsvps', eventId, tenantId });
  }
}

// use shared rsvpSchema from ../../schemas

// 10.7 RSVP to an Event
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; eventId: string }> }
) {
    const { eventId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;


    try {
        // Check if user can view the event in the first place
        const canView = await canUserViewContent(userId, tenantId, 'calendar');
        if (!canView) {
          return forbidden('Cannot RSVP to an event you cannot see.');
        }

        const body = await request.json();
        const result = rsvpSchema.safeParse(body);
        if (!result.success) {
          return validationError(result.error.flatten().fieldErrors);
        }

        // If user is not authenticated, allow guest RSVP only for PUBLIC events
        if (!userId) {
          const event = await prisma.event.findUnique({ where: { id: eventId } });
          if (!event || event.deletedAt || event.tenantId !== tenantId) {
            return validationError({ event: ['Invalid event'] });
          }
          if (event.visibility !== 'PUBLIC') {
            return forbidden('Only public events allow guest RSVPs');
          }

          // Require guest name and email for anonymous RSVP
          if (!result.data.guestName || !result.data.guestEmail) {
            return validationError({ guest: ['Name and email are required for guest RSVP'] });
          }
        }

        const rsvpPayload: any = {
          userId,
          status: result.data.status,
          role: result.data.role,
          notes: result.data.notes,
          guestName: result.data.guestName,
          guestEmail: result.data.guestEmail,
        };

        try {
          const created = await rsvpToEvent(tenantId, eventId, rsvpPayload as any);
          return NextResponse.json(created, { status: 201 });
        } catch (err: any) {
          // Map simple service errors
          const msg = String(err.message || '');
          if (msg.includes('full')) {
            return validationError({ capacity: [msg] });
          }
          if (msg.includes('RegistrationNotOpen')) {
            return validationError({ registration: ['Registration is not open yet'] });
          }
          if (msg.includes('RegistrationClosed')) {
            return validationError({ registration: ['Registration is closed'] });
          }
          throw err;
        }
    } catch (error) {
      console.error(`Failed to RSVP to event ${eventId}:`, error);
      return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/events/[eventId]/rsvps', eventId, tenantId });
    }
}
