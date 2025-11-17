import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';

const prisma = new PrismaClient();

// 10.1 List Events
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from'); // ISO 8601 date string
  const to = searchParams.get('to');     // ISO 8601 date string

  try {
    const canView = await canUserViewContent(userId, params.tenantId, 'calendar');
    if (!canView) {
      return NextResponse.json({ message: 'You do not have permission to view events.' }, { status: 403 });
    }

    const events = await prisma.event.findMany({
      where: {
        tenantId: params.tenantId,
        ...(from && to && {
            startTime: {
                gte: new Date(from),
                lte: new Date(to),
            },
        }),
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error(`Failed to fetch events for tenant ${params.tenantId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch events' }, { status: 500 });
  }
}

const eventCreateSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    location: z.string().optional(),
    isAllDay: z.boolean().optional(),
});

// 10.2 Create Event
export async function POST(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId }, include: { permissions: true } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canCreate = await can(user, tenant, 'canCreateEvents');
    if (!canCreate) {
        return NextResponse.json({ message: 'You do not have permission to create events.' }, { status: 403 });
    }

    const result = eventCreateSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const newEvent = await prisma.event.create({
            data: {
                ...result.data,
                tenantId: params.tenantId,
                authorId: userId,
            },
        });

        return NextResponse.json(newEvent, { status: 201 });
    } catch (error) {
        console.error(`Failed to create event in tenant ${params.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to create event' }, { status: 500 });
    }
}
