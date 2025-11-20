import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { getTenantById, getUserById, requestFacilityBooking } from '@/lib/data';
import { getMembershipForUserInTenant } from '@/lib/data';

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
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const membership = await getMembershipForUserInTenant(userId, tenantId);

  if (!membership || membership.status !== 'APPROVED') {
    return NextResponse.json({ message: 'You must be a member to request a booking.' }, { status: 403 });
  }

  const tenant = await getTenantById(tenantId);
  const user = await getUserById(userId);

  if (!tenant || !user) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
  }

  const payload = await request.json();
  const parsed = bookingSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
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
      return NextResponse.json({ message: 'Facility is not available for the selected time.' }, { status: 409 });
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Unable to request booking.' }, { status: 400 });
  }
}
