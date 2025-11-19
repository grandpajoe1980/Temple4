import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { BookingStatus } from '@prisma/client';
import { getTenantById, getUserById, updateFacilityBookingStatus } from '@/lib/data';
import { can, hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum([BookingStatus.APPROVED, BookingStatus.REJECTED, BookingStatus.CANCELLED]),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ tenantId: string; bookingId: string }> }) {
  const { tenantId, bookingId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;

  if (!userId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const tenant = await getTenantById(tenantId);
  const user = await getUserById(userId);

  if (!tenant || !user) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
  }

  const canManage = (await can(user, tenant as any, 'canManageFacilities')) || (await hasRole(userId, tenantId, [TenantRole.ADMIN]));

  if (!canManage) {
    return NextResponse.json({ message: 'You do not have permission to manage bookings.' }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = statusSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const updated = await updateFacilityBookingStatus(
      tenantId,
      bookingId,
      parsed.data.status,
      parsed.data.notes?.trim() || undefined
    );

    if (!updated) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Unable to update booking' }, { status: 409 });
  }
}
