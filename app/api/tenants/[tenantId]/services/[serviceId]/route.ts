import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { ServiceCategory } from '@prisma/client';
import {
  getMembershipForUserInTenant,
  getServiceOfferingById,
  updateServiceOffering,
  deleteServiceOffering,
} from '@/lib/data';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';

const SERVICE_CATEGORY_VALUES: [ServiceCategory, ...ServiceCategory[]] = [
  'CEREMONY',
  'EDUCATION',
  'FACILITY',
  'COUNSELING',
  'OTHER',
];

const updateSchema = z
  .object({
    name: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    category: z.enum(SERVICE_CATEGORY_VALUES).optional(),
    isPublic: z.boolean().optional(),
    requiresBooking: z.boolean().optional(),
    contactEmailOverride: z.string().email().optional().or(z.literal('')),
    pricing: z.string().max(1000).optional().or(z.literal('')),
    imageUrl: z.string().url().optional().or(z.literal('')),
    order: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; serviceId: string }> }
) {
  const { tenantId, serviceId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;
  let includePrivate = false;

  if (userId) {
    const membership = await getMembershipForUserInTenant(userId, tenantId);
    includePrivate = membership?.status === 'APPROVED';
  }

  const service = await getServiceOfferingById(tenantId, serviceId, includePrivate);

  if (!service) {
    return NextResponse.json({ message: 'Service not found' }, { status: 404 });
  }

  return NextResponse.json(service);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; serviceId: string }> }
) {
  const { tenantId, serviceId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;

  if (!userId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const isManager = await hasRole(userId, tenantId, [TenantRole.ADMIN, TenantRole.STAFF]);

  if (!isManager) {
    return NextResponse.json({ message: 'You do not have permission to manage services.' }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = updateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const normalizedData = {
    ...parsed.data,
    contactEmailOverride:
      parsed.data.contactEmailOverride === undefined
        ? undefined
        : parsed.data.contactEmailOverride?.trim() || undefined,
    pricing: parsed.data.pricing === undefined ? undefined : parsed.data.pricing?.trim() || undefined,
    imageUrl: parsed.data.imageUrl === undefined ? undefined : parsed.data.imageUrl?.trim() || undefined,
  };

  const updated = await updateServiceOffering(tenantId, serviceId, normalizedData);

  if (!updated) {
    return NextResponse.json({ message: 'Service not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; serviceId: string }> }
) {
  const { tenantId, serviceId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;

  if (!userId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const isManager = await hasRole(userId, tenantId, [TenantRole.ADMIN, TenantRole.STAFF]);

  if (!isManager) {
    return NextResponse.json({ message: 'You do not have permission to manage services.' }, { status: 403 });
  }

  const deleted = await deleteServiceOffering(tenantId, serviceId);

  if (!deleted) {
    return NextResponse.json({ message: 'Service not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
