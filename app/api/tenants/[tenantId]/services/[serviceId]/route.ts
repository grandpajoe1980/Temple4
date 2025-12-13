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
import { handleApiError, unauthorized, forbidden, notFound, validationError } from '@/lib/api-response';
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
    contactEmailOverride: z.string().email().nullish().or(z.literal('')),
    pricing: z.string().max(1000).nullish().or(z.literal('')),
    imageUrl: z.string().url().nullish().or(z.literal('')),
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
    return notFound('Service');
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
    return unauthorized();
  }

  const isManager = await hasRole(userId, tenantId, [TenantRole.ADMIN, TenantRole.STAFF]);

  if (!isManager) {
    return forbidden('You do not have permission to manage services.');
  }

  const payload = await request.json();
  const parsed = updateSchema.safeParse(payload);

  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  // Helper to normalize: undefined -> undefined (no change), null/"" -> null (clear), string -> trimmed string
  const normalizeNullable = (val: string | null | undefined) => {
    if (val === undefined) return undefined;
    if (val === null || val.trim() === '') return null;
    return val.trim();
  };

  const normalizedData = {
    ...parsed.data,
    contactEmailOverride: normalizeNullable(parsed.data.contactEmailOverride),
    pricing: normalizeNullable(parsed.data.pricing),
    imageUrl: normalizeNullable(parsed.data.imageUrl),
  };

  const updated = await updateServiceOffering(tenantId, serviceId, normalizedData);

  if (!updated) {
    return notFound('Service');
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
    return unauthorized();
  }

  const isManager = await hasRole(userId, tenantId, [TenantRole.ADMIN, TenantRole.STAFF]);

  if (!isManager) {
    return forbidden('You do not have permission to manage services.');
  }

  const deleted = await deleteServiceOffering(tenantId, serviceId);

  if (!deleted) {
    return notFound('Service');
  }

  return NextResponse.json({ success: true });
}
