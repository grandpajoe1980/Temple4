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
    const uniqueRecurrence = searchParams.get('uniqueRecurrence') === 'true';

    logger.info('Fetching tenant events', { userId, from, to, uniqueRecurrence });

    const events = await listTenantEvents({
      tenantId: resolvedParams.tenantId,
      viewerUserId: userId,
      from,
      to,
      uniqueRecurrence,
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

import { RRule } from 'rrule';
import crypto from 'crypto';

// ... (imports)

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
    const tenant = await prisma.tenant.findUnique({ where: { id: resolvedParams.tenantId }, select: { id: true, permissions: true } });

    if (!user || !tenant) {
      logger.warn('Invalid user or tenant during event creation', { userId });
      return validationError({ _global: ['Invalid user or tenant'] }, 'Invalid user or tenant');
    }

    const canCreate = await can(user, tenant as any, 'canCreateEvents');
    if (!canCreate) {
      logger.warn('Permission denied for event creation', { userId });
      return forbidden('You do not have permission to create events.');
    }

    const payload = await request.json();
    const result = createEventSchema.safeParse(payload);
    if (!result.success) {
      logger.warn('Event creation validation failed', { errors: result.error.flatten().fieldErrors });
      return validationError(result.error.flatten().fieldErrors);
    }

    const baseEventData = {
      ...result.data,
      tenantId: resolvedParams.tenantId,
      createdByUserId: userId,
    };

    // Handle Recurrence
    if (baseEventData.recurrenceRule) {
      try {
        const ruleOptions = RRule.parseString(baseEventData.recurrenceRule);
        ruleOptions.dtstart = new Date(baseEventData.startDateTime);
        const rule = new RRule(ruleOptions);

        // Limit to 1 year or 52 occurrences to prevent infinite loops or massive spam
        const now = new Date();
        const limitDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

        // Helper to calculate duration for end time adjustment
        const duration = baseEventData.endDateTime
          ? new Date(baseEventData.endDateTime).getTime() - new Date(baseEventData.startDateTime).getTime()
          : 0;

        logger.info('Recurrence Processing', { recurrenceRule: baseEventData.recurrenceRule, startDateTime: baseEventData.startDateTime, limitDate, duration });

        const occurrences = rule.between(new Date(baseEventData.startDateTime), limitDate, true, (_, i) => i < 52);

        logger.info('Generated Occurrences', { count: occurrences.length, dates: occurrences.map(d => d.toISOString()) });

        const recurrenceGroupId = crypto.randomUUID();

        const eventsToCreate = occurrences.map(date => {
          const start = date;
          const end = duration ? new Date(date.getTime() + duration) : undefined;

          return {
            ...baseEventData,
            recurrenceGroupId,
            startDateTime: start.toISOString(),
            endDateTime: end?.toISOString(),
          };
        });

        const createdEvents = [];
        for (const evtData of eventsToCreate) {
          try {
            const evt = await createEvent(evtData as any);
            createdEvents.push(evt);
          } catch (createErr) {
            logger.error('Failed to create instance', { error: createErr, data: evtData });
            throw createErr;
          }
        }

        logger.info('Recurring events created successfully', { userId, count: createdEvents.length, recurrenceGroupId });
        // Return the first one
        const firstEvent = createdEvents[0];
        return NextResponse.json(mapEventToResponseDto({ ...(firstEvent as any), creator: { profile: null, email: user.email }, _count: { rsvps: 0 } } as any), { status: 201 });

      } catch (e) {
        logger.error('Failed to process recurrence rule', { error: e });
        // Returning validation error instead of generic error
        console.error(e);
        return validationError({ recurrenceRule: ['Invalid recurrence rule or processing error'] });
      }
    }

    // Single Event
    const newEvent = await createEvent(baseEventData as any);

    logger.info('Event created successfully', { userId, eventId: newEvent.id });
    return NextResponse.json(mapEventToResponseDto({ ...(newEvent as any), creator: { profile: null, email: user.email }, _count: { rsvps: 0 } } as any), { status: 201 });
  } catch (error) {
    console.error('Event creation (POST) error:', error);
    return handleApiError(error, {
      route: 'POST /api/tenants/[tenantId]/events',
      tenantId: resolvedParams.tenantId,
    });
  }
}
