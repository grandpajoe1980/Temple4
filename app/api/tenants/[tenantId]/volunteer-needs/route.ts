import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, hasRole } from '@/lib/permissions';
import { z } from 'zod';
import {  } from '@prisma/client';
import { TenantRole } from '@/types';

const volunteerNeedSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  date: z.string().datetime(),
  slotsNeeded: z.number().int().positive('At least one slot is required'),
  eventId: z.string().optional(),
  location: z.string().max(200).optional(),
});

// GET /api/tenants/[tenantId]/volunteer-needs - List volunteer needs
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    // Check if volunteering is enabled
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: {
        enableVolunteering: true,
      }
    });

    if (!tenantSettings || !tenantSettings.enableVolunteering) {
      return NextResponse.json(
        { message: 'Volunteering is not enabled for this tenant' },
        { status: 403 }
      );
    }

    // Check if user can view content
    const canView = await canUserViewContent(userId, tenantId, 'posts');
    if (!canView) {
      return NextResponse.json(
        { message: 'You do not have permission to view volunteer needs' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const upcoming = searchParams.get('upcoming') === 'true';
    const offset = (page - 1) * limit;

    const whereClause: any = { tenantId };
    
    if (upcoming) {
      whereClause.date = { gte: new Date() };
    }

    const [needs, totalCount] = await Promise.all([
      prisma.volunteerNeed.findMany({
        where: whereClause,
        include: {
          signups: {
            where: {
              status: 'CONFIRMED'
            },
            include: {
              user: {
                include: {
                  profile: true
                }
              }
            }
          }
        },
        orderBy: {
          date: 'asc'
        },
        skip: offset,
        take: limit,
      }),
      prisma.volunteerNeed.count({ where: whereClause })
    ]);

    // Add filled slots count
    const needsWithCounts = needs.map((need: any) => ({
      ...need,
      filledSlots: need.signups.length,
      isUserSignedUp: userId ? need.signups.some((s: any) => s.userId === userId) : false,
    }));

    return NextResponse.json({
      needs: needsWithCounts,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalResults: totalCount,
      }
    });
  } catch (error) {
    console.error(`Failed to fetch volunteer needs for tenant ${tenantId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch volunteer needs' }, { status: 500 });
  }
}

// POST /api/tenants/[tenantId]/volunteer-needs - Create volunteer need (staff/admin only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    // Check if volunteering is enabled
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: {
        enableVolunteering: true,
      }
    });

    if (!tenantSettings || !tenantSettings.enableVolunteering) {
      return NextResponse.json(
        { message: 'Volunteering is not enabled for this tenant' },
        { status: 403 }
      );
    }

    // Check if user is staff or admin
    const isStaff = await hasRole(userId, tenantId, [TenantRole.ADMIN, TenantRole.STAFF, TenantRole.CLERGY]);
    if (!isStaff) {
      return NextResponse.json(
        { message: 'You must be staff or admin to create volunteer needs' },
        { status: 403 }
      );
    }

    // Validate input
    const body = await request.json();
    const result = volunteerNeedSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, date, slotsNeeded, eventId, location } = result.data;

    // If eventId provided, verify it exists and belongs to this tenant
    if (eventId) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { tenantId: true }
      });

      if (!event || event.tenantId !== tenantId) {
        return NextResponse.json(
          { message: 'Invalid event ID' },
          { status: 400 }
        );
      }
    }

    const volunteerNeed = await prisma.volunteerNeed.create({
      data: {
        tenantId,
        title,
        description,
        date: new Date(date),
        slotsNeeded,
        eventId,
        location,
      },
      include: {
        signups: true
      }
    });

    return NextResponse.json(volunteerNeed, { status: 201 });
  } catch (error) {
    console.error(`Failed to create volunteer need for tenant ${tenantId}:`, error);
    return NextResponse.json({ message: 'Failed to create volunteer need' }, { status: 500 });
  }
}
