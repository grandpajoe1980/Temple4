import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { can, canUserViewContent } from '@/lib/permissions';

// 10.6 List Event RSVPs
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; eventId: string }> }
) {
    const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    // Only event creators or admins/staff can see the full RSVP list
    const event = await prisma.event.findUnique({ where: { id: params.eventId } });
    const canManage = await can(user, tenant, 'canCreateEvents'); // Assuming this permission level
    
    if (event?.createdByUserId !== userId && !canManage) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const rsvps = await prisma.eventRSVP.findMany({
      where: { eventId: params.eventId },
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
    console.error(`Failed to fetch RSVPs for event ${params.eventId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch RSVPs' }, { status: 500 });
  }
}

// 10.7 RSVP to an Event
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; eventId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Check if user can view the event in the first place
        const canView = await canUserViewContent(userId, params.tenantId, 'calendar');
        if (!canView) {
            return NextResponse.json({ message: 'Cannot RSVP to an event you cannot see.' }, { status: 403 });
        }

        // Check if user is already RSVP'd
        const existingRsvp = await prisma.eventRSVP.findUnique({
            where: { userId_eventId: { userId, eventId: params.eventId } }
        });

        if (existingRsvp) {
            return NextResponse.json({ message: 'You have already RSVP\'d to this event.' }, { status: 409 });
        }

        const newRsvp = await prisma.eventRSVP.create({
            data: {
                userId,
                eventId: params.eventId,
            },
        });

        return NextResponse.json(newRsvp, { status: 201 });
    } catch (error) {
        console.error(`Failed to RSVP to event ${params.eventId}:`, error);
        return NextResponse.json({ message: 'Failed to RSVP to event' }, { status: 500 });
    }
}
