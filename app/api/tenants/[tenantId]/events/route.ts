import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { can } from '@/lib/permissions';
import { z } from 'zod';
import { createEventSchema } from './schemas';
import { handleApiError, forbidden, unauthorized, validationError } from '@/lib/api-response';
import { createRouteLogger } from '@/lib/logger';
import { listTenantEvents, EventPermissionError, mapEventToResponseDto, createEvent } from '@/lib/services/event-service';

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

// using shared schema from ./schemas

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
        return validationError({ _global: ['Invalid user or tenant'] }, 'Invalid user or tenant');
      }

      const canCreate = await can(user, tenant, 'canCreateEvents');
      if (!canCreate) {
        logger.warn('Permission denied for event creation', { userId });
        return forbidden('You do not have permission to create events.');
      }

      const result = createEventSchema.safeParse(await request.json());
      if (!result.success) {
        logger.warn('Event creation validation failed', { errors: result.error.flatten().fieldErrors });
        return validationError(result.error.flatten().fieldErrors);
      }

      const newEvent = await createEvent({
        ...result.data,
        tenantId: resolvedParams.tenantId,
        createdByUserId: userId,
      } as any);

      logger.info('Event created successfully', { userId, eventId: newEvent.id });
      return NextResponse.json(mapEventToResponseDto({ ...(newEvent as any), creator: { profile: null, email: user.email }, _count: { rsvps: 0 } } as any), { status: 201 });
    } catch (error) {
      return handleApiError(error, {
        route: 'POST /api/tenants/[tenantId]/events',
        tenantId: resolvedParams.tenantId,
      });
    }
}
