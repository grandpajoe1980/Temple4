import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { getTenantById, getUserById, requestFacilityBooking } from '@/lib/data';
import { getMembershipForUserInTenant } from '@/lib/data';
import { handleApiError, unauthorized, forbidden, notFound, conflict, validationError } from '@/lib/api-response';

const bookingSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  purpose: z.string().min(1),
  eventId: z.string().optional(),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string; facilityId: string }> }) {
  const { tenantId, facilityId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;

  if (!userId) {
    return unauthorized();
  }

  const membership = await getMembershipForUserInTenant(userId, tenantId);

  if (!membership || membership.status !== 'APPROVED') {
    return forbidden('You must be a member to request a booking.');
  }

  const tenant = await getTenantById(tenantId);
  const user = await getUserById(userId);

  if (!tenant || !user) {
    return notFound('Tenant or User');
  }

  const payload = await request.json();
  const parsed = bookingSchema.safeParse(payload);

  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);

  try {
    const booking = await requestFacilityBooking({
      facilityId,
      tenantId,
      requestedById: user.id,
      startAt,
      endAt,
      purpose: parsed.data.purpose,
      eventId: parsed.data.eventId,
      notes: parsed.data.notes?.trim() || undefined,
    });

    if (!booking) {
      return conflict('Facility is not available for the selected time.');
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/facilities/[facilityId]/book', tenantId, facilityId });
  }
}
