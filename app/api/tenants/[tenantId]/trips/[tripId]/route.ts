import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getTripById, getMembershipForUserInTenant } from '@/lib/data';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { notFound, forbidden, unauthorized, validationError, handleApiError } from '@/lib/api-response';

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

    if (!trip) return notFound('Trip');
    if ((trip as any).tenantId !== tenantId) return validationError({ tenant: ['Tenant mismatch'] });

    if (!trip.isPublic) {
      if (!membership || membership.status !== 'APPROVED') {
        return forbidden('Forbidden');
      }
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error(`Failed to fetch trip ${tripId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/trips/[tripId]', tripId, tenantId });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ tenantId: string; tripId: string }> }) {
  const { tenantId, tripId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return unauthorized();
  }

  const result = tripUpdateSchema.safeParse(await request.json());
  if (!result.success) {
    return validationError(result.error.flatten().fieldErrors);
  }

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return notFound('Trip');
    if (trip.tenantId !== tenantId) return validationError({ tenant: ['Tenant mismatch'] });

    const tripMembership = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = !!userRecord?.isSuperAdmin;
    const isAdmin = isSuperAdmin || (await hasRole(userId, tenantId, [TenantRole.ADMIN]));

    if (tripMembership?.role !== 'LEADER' && tripMembership?.role !== 'CO_LEADER' && !isAdmin) {
      return forbidden('Only trip leaders, tenant admins, or platform super-admins can update the trip.');
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
    return handleApiError(error, { route: 'PUT /api/tenants/[tenantId]/trips/[tripId]', tripId, tenantId });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ tenantId: string; tripId: string }> }) {
  const { tenantId, tripId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return unauthorized();
  }

  try {
    const tripMembership = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = !!userRecord?.isSuperAdmin;
    const isAdminDelete = isSuperAdmin || (await hasRole(userId, tenantId, [TenantRole.ADMIN]));
    if (tripMembership?.role !== 'LEADER' && tripMembership?.role !== 'CO_LEADER' && !isAdminDelete) {
      return forbidden('Only trip leaders, tenant admins, or platform super-admins can archive the trip.');
    }

    await prisma.trip.update({
      where: { id: tripId },
      data: { archivedAt: new Date(), status: 'ARCHIVED' },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Failed to delete trip ${tripId}:`, error);
    return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/trips/[tripId]', tripId, tenantId });
  }
}
