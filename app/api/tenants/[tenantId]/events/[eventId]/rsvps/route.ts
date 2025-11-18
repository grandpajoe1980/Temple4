import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { can, canUserViewContent } from '@/lib/permissions';
import { z } from 'zod';
import { RSVPStatus } from '@prisma/client';

// 10.6 List Event RSVPs
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; eventId: string }> }
) {
    const { eventId, tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    // Only event creators or admins/staff can see the full RSVP list
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    const canManage = await can(user, tenant, 'canCreateEvents'); // Assuming this permission level
    
    if (event?.createdByUserId !== userId && !canManage) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
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
    return NextResponse.json({ message: 'Failed to fetch RSVPs' }, { status: 500 });
  }
}

const rsvpCreateSchema = z.object({
    status: z.enum(['GOING', 'INTERESTED', 'NOT_GOING']).optional().default('GOING'),
});

// 10.7 RSVP to an Event
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; eventId: string }> }
) {
    const { eventId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Check if user can view the event in the first place
        const canView = await canUserViewContent(userId, tenantId, 'calendar');
        if (!canView) {
            return NextResponse.json({ message: 'Cannot RSVP to an event you cannot see.' }, { status: 403 });
        }

        const body = await request.json();
        const result = rsvpCreateSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
        }

        // Check if user is already RSVP'd
        const existingRsvp = await prisma.eventRSVP.findUnique({
            where: { userId_eventId: { userId, eventId: eventId } }
        });

        if (existingRsvp) {
            // Update existing RSVP instead of returning error
            const updatedRsvp = await prisma.eventRSVP.update({
                where: { userId_eventId: { userId, eventId: eventId } },
                data: { status: result.data.status as RSVPStatus },
            });
            return NextResponse.json(updatedRsvp);
        }

        const newRsvp = await prisma.eventRSVP.create({
            data: {
                userId,
                eventId: eventId,
                status: result.data.status as RSVPStatus,
            },
        });

        return NextResponse.json(newRsvp, { status: 201 });
    } catch (error) {
        console.error(`Failed to RSVP to event ${eventId}:`, error);
        return NextResponse.json({ message: 'Failed to RSVP to event' }, { status: 500 });
    }
}
