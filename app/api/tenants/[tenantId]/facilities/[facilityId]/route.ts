import { NextResponse } from 'next/server';
import { getFacilityById, getTenantById, getUserById, updateFacility } from '@/lib/data';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { can, hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { z } from 'zod';
import { FacilityType } from '@prisma/client';

const FACILITY_TYPE_VALUES: [FacilityType, ...FacilityType[]] = ['ROOM', 'HALL', 'EQUIPMENT', 'VEHICLE', 'OTHER'];

const updateSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  type: z.enum(FACILITY_TYPE_VALUES).optional(),
  location: z.string().max(500).optional().or(z.literal('')),
  capacity: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  bookingRules: z.record(z.any()).optional(),
});

export async function GET(_req: Request, { params }: { params: { tenantId: string; facilityId: string } }) {
  const { tenantId, facilityId } = params;
  const facility = await getFacilityById(tenantId, facilityId, true);

  if (!facility) {
    return NextResponse.json({ message: 'Facility not found' }, { status: 404 });
  }

  return NextResponse.json(facility);
}

export async function PATCH(request: Request, { params }: { params: { tenantId: string; facilityId: string } }) {
  const { tenantId, facilityId } = params;
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
    return NextResponse.json({ message: 'You do not have permission to manage facilities.' }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = updateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const normalized = {
    ...parsed.data,
    description: parsed.data.description?.trim() ?? undefined,
    location: parsed.data.location?.trim() ?? undefined,
    imageUrl: parsed.data.imageUrl?.trim() || undefined,
  };

  const updated = await updateFacility(tenantId, facilityId, normalized);

  if (!updated) {
    return NextResponse.json({ message: 'Facility not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
