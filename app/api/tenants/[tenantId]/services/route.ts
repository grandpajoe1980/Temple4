import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { ServiceCategory } from '@prisma/client';
import { getMembershipForUserInTenant, getServiceOfferingsForTenant, createServiceOffering } from '@/lib/data';
import { hasRole } from '@/lib/permissions';
import { handleApiError, unauthorized, forbidden, validationError } from '@/lib/api-response';
import { TenantRole } from '@/types';

const SERVICE_CATEGORY_VALUES: [ServiceCategory, ...ServiceCategory[]] = [
  'CEREMONY',
  'EDUCATION',
  'FACILITY',
  'COUNSELING',
  'OTHER',
];

const serviceOfferingSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  category: z.enum(SERVICE_CATEGORY_VALUES),
  isPublic: z.boolean().optional(),
  requiresBooking: z.boolean().optional(),
  contactEmailOverride: z
    .string()
    .email('Contact email must be valid')
    .optional()
    .or(z.literal('')),
  pricing: z.string().max(1000).optional().or(z.literal('')),
  imageUrl: z.string().url('Image URL must be valid').optional().or(z.literal('')),
  order: z.number().int().min(0).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;
  let includePrivate = false;

  if (userId) {
    const membership = await getMembershipForUserInTenant(userId, tenantId);
    includePrivate = membership?.status === 'APPROVED';
  }

  const filters: { includePrivate?: boolean; category?: ServiceCategory } = {
    includePrivate,
  };

  if (category && SERVICE_CATEGORY_VALUES.includes(category as ServiceCategory)) {
    filters.category = category as ServiceCategory;
  }

  const services = await getServiceOfferingsForTenant(tenantId, filters);
  return NextResponse.json(services);
}

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
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
  const parsed = serviceOfferingSchema.safeParse(payload);

  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  const normalizedData = {
    ...parsed.data,
    contactEmailOverride: parsed.data.contactEmailOverride?.trim() || undefined,
    pricing: parsed.data.pricing?.trim() || undefined,
    imageUrl: parsed.data.imageUrl?.trim() || undefined,
  };

  const service = await createServiceOffering(tenantId, normalizedData);
  return NextResponse.json(service, { status: 201 });
}
