import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { BookingStatus } from '@prisma/client';
import { getTenantById, getUserById, updateFacilityBookingStatus } from '@/lib/data';
import { can, hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { z } from 'zod';
import { handleApiError, unauthorized, forbidden, notFound, validationError } from '@/lib/api-response';

const statusSchema = z.object({
  status: z.enum([BookingStatus.APPROVED, BookingStatus.REJECTED, BookingStatus.CANCELLED]),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ tenantId: string; bookingId: string }> }) {
  const { tenantId, bookingId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;

  if (!userId) {
    return unauthorized();
  }

  const tenant = await getTenantById(tenantId);
  const user = await getUserById(userId);

  if (!tenant || !user) {
    return notFound('Tenant or User');
  }

  const canManage = (await can(user, tenant as any, 'canManageFacilities')) || (await hasRole(userId, tenantId, [TenantRole.ADMIN]));

  if (!canManage) {
    return forbidden('You do not have permission to manage bookings.');
  }

  const payload = await request.json();
  const parsed = statusSchema.safeParse(payload);

  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  try {
    const updated = await updateFacilityBookingStatus(
      tenantId,
      bookingId,
      parsed.data.status,
      parsed.data.notes?.trim() || undefined
    );

    if (!updated) {
      return notFound('Booking');
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return handleApiError(error, { route: 'PATCH /api/tenants/[tenantId]/facilities/bookings/[bookingId]', tenantId, bookingId });
  }
}
