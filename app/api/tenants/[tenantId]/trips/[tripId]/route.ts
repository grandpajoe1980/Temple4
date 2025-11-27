import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getTripById, getMembershipForUserInTenant } from '@/lib/data';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';

const tripUpdateSchema = z.object({
  name: z.string().min(3).optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  departureLocation: z.string().optional(),
  destination: z.string().optional(),
  meetingPoint: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  waitlistEnabled: z.boolean().optional(),
  costCents: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().min(3).max(5).optional(),
  depositCents: z.number().int().nonnegative().nullable().optional(),
  allowPartialPayments: z.boolean().optional(),
  allowScholarships: z.boolean().optional(),
  allowMessages: z.boolean().optional(),
  allowPhotos: z.boolean().optional(),
  waiverRequired: z.boolean().optional(),
  waiverUrl: z.string().url().optional(),
  formUrl: z.string().url().optional(),
  fundraisingEnabled: z.boolean().optional(),
  fundraisingGoalCents: z.number().int().nonnegative().nullable().optional(),
  fundraisingDeadline: z.string().optional(),
  fundraisingVisibility: z.string().optional(),
  allowSponsorship: z.boolean().optional(),
  colorHex: z.string().optional(),
  joinPolicy: z.enum(['OPEN', 'APPROVAL']).optional(),
  isPublic: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  status: z.enum(['PLANNING', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'ARCHIVED']).optional(),
  leaderUserId: z.string().optional(),
  coLeaderUserId: z.string().optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string; tripId: string }> }) {
  const { tenantId, tripId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const membership = userId ? await getMembershipForUserInTenant(userId, tenantId) : null;
    const trip = await getTripById(tripId);

    if (!trip) return NextResponse.json({ message: 'Trip not found' }, { status: 404 });
    if ((trip as any).tenantId !== tenantId) return NextResponse.json({ message: 'Tenant mismatch' }, { status: 400 });

    if (!trip.isPublic) {
      if (!membership || membership.status !== 'APPROVED') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error(`Failed to fetch trip ${tripId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch trip' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ tenantId: string; tripId: string }> }) {
  const { tenantId, tripId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const result = tripUpdateSchema.safeParse(await request.json());
  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return NextResponse.json({ message: 'Trip not found' }, { status: 404 });
    if (trip.tenantId !== tenantId) return NextResponse.json({ message: 'Tenant mismatch' }, { status: 400 });

    const tripMembership = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = !!userRecord?.isSuperAdmin;
    const isAdmin = isSuperAdmin || (await hasRole(userId, tenantId, [TenantRole.ADMIN]));

    if (tripMembership?.role !== 'LEADER' && tripMembership?.role !== 'CO_LEADER' && !isAdmin) {
      return NextResponse.json({ message: 'Only trip leaders, tenant admins, or platform super-admins can update the trip.' }, { status: 403 });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...result.data,
        startDate: result.data.startDate ? new Date(result.data.startDate) : trip.startDate,
        endDate: result.data.endDate ? new Date(result.data.endDate) : trip.endDate,
        fundraisingDeadline: result.data.fundraisingDeadline ? new Date(result.data.fundraisingDeadline) : trip.fundraisingDeadline,
      },
    });

    if (result.data.leaderUserId) {
      await prisma.tripMember.upsert({
        where: { tripId_userId: { tripId, userId: result.data.leaderUserId } },
        create: {
          tripId,
          userId: result.data.leaderUserId,
          role: 'LEADER',
          status: 'APPROVED',
          joinedAt: new Date(),
        },
        update: { role: 'LEADER', status: 'APPROVED' },
      });
    }

    if (result.data.coLeaderUserId) {
      await prisma.tripMember.upsert({
        where: { tripId_userId: { tripId, userId: result.data.coLeaderUserId } },
        create: {
          tripId,
          userId: result.data.coLeaderUserId,
          role: 'CO_LEADER',
          status: 'APPROVED',
          joinedAt: new Date(),
        },
        update: { role: 'CO_LEADER', status: 'APPROVED' },
      });
    }

    return NextResponse.json(updatedTrip);
  } catch (error) {
    console.error(`Failed to update trip ${tripId}:`, error);
    return NextResponse.json({ message: 'Failed to update trip' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ tenantId: string; tripId: string }> }) {
  const { tenantId, tripId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const tripMembership = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = !!userRecord?.isSuperAdmin;
    const isAdminDelete = isSuperAdmin || (await hasRole(userId, tenantId, [TenantRole.ADMIN]));
    if (tripMembership?.role !== 'LEADER' && tripMembership?.role !== 'CO_LEADER' && !isAdminDelete) {
      return NextResponse.json({ message: 'Only trip leaders, tenant admins, or platform super-admins can archive the trip.' }, { status: 403 });
    }

    await prisma.trip.update({
      where: { id: tripId },
      data: { archivedAt: new Date(), status: 'ARCHIVED' },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Failed to delete trip ${tripId}:`, error);
    return NextResponse.json({ message: 'Failed to delete trip' }, { status: 500 });
  }
}
