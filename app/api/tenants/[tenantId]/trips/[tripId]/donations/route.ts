import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { addTripDonation, getMembershipForUserInTenant } from '@/lib/data';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { validationError, notFound, forbidden, handleApiError } from '@/lib/api-response';

const donationSchema = z.object({
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(5).optional(),
  sponsoredUserId: z.string().optional(),
  displayName: z.string().optional(),
  message: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  coverFees: z.boolean().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string; tripId: string }> }) {
  const { tenantId, tripId } = await params;
  const session = await getServerSession(authOptions);
  const donorUserId = (session?.user as any)?.id;

  const body = await request.json().catch(() => null);
  const result = donationSchema.safeParse(body);
  if (!result.success) return validationError(result.error.flatten().fieldErrors);

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { tenant: { include: { settings: true } } } });
    if (!trip || trip.tenantId !== tenantId) return notFound('Trip');

    if (!trip.tenant.settings?.enableTrips) return forbidden('Trips feature disabled');
    if (trip.fundraisingEnabled === false) return forbidden('Fundraising disabled for this trip');

    // If fundraiser is tenant-private, require membership
    if (trip.fundraisingVisibility !== 'PUBLIC') {
      const membership = donorUserId ? await getMembershipForUserInTenant(donorUserId, tenantId) : null;
      if (!membership) return forbidden('Membership required to donate to this trip');
    }

    const donation = await addTripDonation(tripId, { ...result.data, donorUserId });
    return NextResponse.json(donation, { status: 201 });
  } catch (error) {
    console.error(`Failed to create trip donation for ${tripId}:`, error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/trips/[tripId]/donations', tenantId, tripId });
  }
}
