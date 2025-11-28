import { NextResponse } from 'next/server';
import { getFacilityById, getTenantById, getUserById, updateFacility } from '@/lib/data';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { can, hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { z } from 'zod';
import { FacilityType } from '@prisma/client';
import { handleApiError, unauthorized, forbidden, notFound, validationError } from '@/lib/api-response';

const FACILITY_TYPE_VALUES: [FacilityType, ...FacilityType[]] = ['ROOM', 'HALL', 'EQUIPMENT', 'VEHICLE', 'OTHER'];

const updateSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  type: z.enum(FACILITY_TYPE_VALUES).optional(),
  location: z.string().max(500).optional().or(z.literal('')),
  capacity: z.number().int().positive().optional(),
  // Accept absolute URLs or relative paths starting with '/'
  imageUrl: z.union([z.string().regex(/^(\/|https?:\/\/).*/), z.literal('')]).optional(),
  isActive: z.boolean().optional(),
  bookingRules: z.record(z.string(), z.any()).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ tenantId: string; facilityId: string }> }) {
  const { tenantId, facilityId } = await params;
  const facility = await getFacilityById(tenantId, facilityId, true);

  if (!facility) {
    return notFound('Facility');
  }

  return NextResponse.json(facility);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ tenantId: string; facilityId: string }> }) {
  const { tenantId, facilityId } = await params;
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
    return forbidden('You do not have permission to manage facilities.');
  }

  const payload = await request.json();
  const parsed = updateSchema.safeParse(payload);

  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  const normalized = {
    ...parsed.data,
    description: parsed.data.description?.trim() ?? undefined,
    location: parsed.data.location?.trim() ?? undefined,
    imageUrl: parsed.data.imageUrl?.trim() || undefined,
  };

  const updated = await updateFacility(tenantId, facilityId, normalized);

  if (!updated) {
    return notFound('Facility');
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ tenantId: string; facilityId: string }> }) {
  const { tenantId, facilityId } = await params;
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
    return forbidden('You do not have permission to manage facilities.');
  }

  try {
    // delete facility (will cascade bookings/blackouts because of DB relations)
    const { deleteFacility } = await import('@/lib/data');
    const ok = await deleteFacility(tenantId, facilityId);

    if (!ok) {
      return notFound('Facility');
    }

    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('Failed to delete facility', err);
    return handleApiError(err, { route: 'DELETE /api/tenants/[tenantId]/facilities/[facilityId]', tenantId, facilityId });
  }
}
