import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { can } from '@/lib/permissions';
import { z } from 'zod';
import { handleApiError, forbidden, unauthorized } from '@/lib/api-response';
import { createRouteLogger } from '@/lib/logger';
import { listTenantEvents, EventPermissionError, mapEventToResponseDto } from '@/lib/services/event-service';

// 10.1 List Events
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  const logger = createRouteLogger('GET /api/tenants/[tenantId]/events', {
    tenantId: resolvedParams.tenantId,
  });

  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    logger.info('Fetching tenant events', { userId, from, to });

    const events = await listTenantEvents({
      tenantId: resolvedParams.tenantId,
      viewerUserId: userId,
      from,
      to,
    });

    return NextResponse.json(events);
  } catch (error) {
    if (error instanceof EventPermissionError) {
      logger.warn('Permission denied for events listing');
      return forbidden(error.message);
    }

    return handleApiError(error, {
      route: 'GET /api/tenants/[tenantId]/events',
      tenantId: resolvedParams.tenantId,
    });
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
    const logger = createRouteLogger('POST /api/tenants/[tenantId]/events', {
      tenantId: resolvedParams.tenantId,
    });

    try {
      const session = await getServerSession(authOptions);
      const userId = (session?.user as any)?.id;

      if (!userId) {
        logger.warn('Unauthenticated event creation attempt');
        return unauthorized();
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      const tenant = await prisma.tenant.findUnique({ where: { id: resolvedParams.tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

      if (!user || !tenant) {
        logger.warn('Invalid user or tenant during event creation', { userId });
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
      }

      const canCreate = await can(user, tenant, 'canCreateEvents');
      if (!canCreate) {
        logger.warn('Permission denied for event creation', { userId });
        return forbidden('You do not have permission to create events.');
      }

      const result = eventCreateSchema.safeParse(await request.json());
      if (!result.success) {
        logger.warn('Event creation validation failed', { errors: result.error.flatten().fieldErrors });
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
      }

      const newEvent = await prisma.event.create({
        data: {
          ...result.data,
          tenantId: resolvedParams.tenantId,
          createdByUserId: userId,
          startDateTime: new Date(result.data.startDateTime),
          endDateTime: new Date(result.data.endDateTime),
        },
      });

      logger.info('Event created successfully', { userId, eventId: newEvent.id });
      return NextResponse.json(mapEventToResponseDto({ ...(newEvent as any), creator: { profile: null, email: user.email }, _count: { rsvps: 0 } } as any), { status: 201 });
    } catch (error) {
      return handleApiError(error, {
        route: 'POST /api/tenants/[tenantId]/events',
        tenantId: resolvedParams.tenantId,
      });
    }
}
