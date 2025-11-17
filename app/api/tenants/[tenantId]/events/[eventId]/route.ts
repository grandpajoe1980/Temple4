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
    const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, params.tenantId, 'calendar');
    if (!canView) {
      return NextResponse.json({ message: 'You do not have permission to view this event.' }, { status: 403 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.eventId, tenantId: params.tenantId },
    });

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error(`Failed to fetch event ${params.eventId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch event' }, { status: 500 });
  }
}

const eventUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    location: z.string().optional(),
    isAllDay: z.boolean().optional(),
});

// 10.4 Update Event
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; eventId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

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
        const updatedEvent = await prisma.event.update({
            where: { id: params.eventId, tenantId: params.tenantId },
            data: result.data,
        });

        return NextResponse.json(updatedEvent);
    } catch (error) {
        console.error(`Failed to update event ${params.eventId}:`, error);
        return NextResponse.json({ message: 'Failed to update event' }, { status: 500 });
    }
}

// 10.5 Delete Event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; eventId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canDelete = await can(user, tenant, 'canCreateEvents'); // Assuming same permission for delete
    if (!canDelete) {
        return NextResponse.json({ message: 'You do not have permission to delete events.' }, { status: 403 });
    }

    try {
        await prisma.event.delete({
            where: { id: params.eventId, tenantId: params.tenantId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete event ${params.eventId}:`, error);
        return NextResponse.json({ message: 'Failed to delete event' }, { status: 500 });
    }
}
