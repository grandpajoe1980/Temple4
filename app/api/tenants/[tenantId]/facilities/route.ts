import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { FacilityType } from '@prisma/client';
import {
  createFacility,
  getFacilitiesForTenant,
  getMembershipForUserInTenant,
  getTenantById,
  getUserById,
} from '@/lib/data';
import { can, hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';

const FACILITY_TYPE_VALUES: [FacilityType, ...FacilityType[]] = ['ROOM', 'HALL', 'EQUIPMENT', 'VEHICLE', 'OTHER'];

const facilitySchema = z.object({
  name: z.string().min(3, 'Name is required'),
  description: z.string().max(2000).optional().or(z.literal('')),
  type: z.enum(FACILITY_TYPE_VALUES),
  location: z.string().max(500).optional().or(z.literal('')),
  capacity: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  bookingRules: z.record(z.string(), z.any()).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  try {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id ?? null;
    let includeInactive = false;

    if (userId) {
      try {
        const membership = await getMembershipForUserInTenant(userId, tenantId);
        const roles = (membership as any)?.roles;
        includeInactive = membership?.status === 'APPROVED' && Array.isArray(roles) && roles.some((role: any) => role?.role === TenantRole.ADMIN);
      } catch (err) {
        // Log and continue with includeInactive=false
        // eslint-disable-next-line no-console
        console.error('Error loading membership for facilities GET', err);
        includeInactive = false;
      }
    }

    const facilities = await getFacilitiesForTenant(tenantId, { includeInactive });

    return NextResponse.json(facilities);
  } catch (err: any) {
    // Ensure we always return a JSON error response and log the issue
    // eslint-disable-next-line no-console
    console.error('Facilities GET failed', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
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
  const parsed = facilitySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const normalized = {
    ...parsed.data,
    description: parsed.data.description?.trim() || undefined,
    location: parsed.data.location?.trim() || undefined,
    imageUrl: parsed.data.imageUrl?.trim() || undefined,
  };

  const facility = await createFacility(tenantId, normalized);
  return NextResponse.json(facility, { status: 201 });
}
