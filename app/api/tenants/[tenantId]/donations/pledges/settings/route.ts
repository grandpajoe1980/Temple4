import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { forbidden, handleApiError, notFound, unauthorized, validationError } from '@/lib/api-response';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';

const settingsSchema = z.object({
  maxFailuresBeforePause: z.number().int().min(1).max(10).optional(),
  retryIntervalHours: z.number().int().min(1).max(168).optional(), // max 1 week
  dunningEmailDays: z.array(z.number().int().min(1).max(30)).optional(),
  gracePeriodDays: z.number().int().min(0).max(30).optional(),
  autoResumeOnSuccess: z.boolean().optional(),
});

// GET: Get pledge settings for a tenant
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) return unauthorized();
  const userId = (session.user as any).id;

  try {
    const isAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);
    if (!isAdmin) return forbidden('Only admins can view pledge settings');

    let settings = await prisma.pledgeSettings.findUnique({
      where: { tenantId },
    });

    // Return defaults if not yet configured
    if (!settings) {
      settings = {
        id: '',
        tenantId,
        maxFailuresBeforePause: 3,
        retryIntervalHours: 24,
        dunningEmailDays: [3, 7, 14] as any,
        gracePeriodDays: 7,
        autoResumeOnSuccess: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error(`Failed to fetch pledge settings for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/donations/pledges/settings', tenantId });
  }
}

// PUT: Update pledge settings for a tenant
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) return unauthorized();
  const userId = (session.user as any).id;

  try {
    const isAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);
    if (!isAdmin) return forbidden('Only admins can update pledge settings');

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten().fieldErrors);

    const settings = await prisma.pledgeSettings.upsert({
      where: { tenantId },
      update: {
        ...parsed.data,
        dunningEmailDays: parsed.data.dunningEmailDays as any,
      },
      create: {
        tenantId,
        maxFailuresBeforePause: parsed.data.maxFailuresBeforePause ?? 3,
        retryIntervalHours: parsed.data.retryIntervalHours ?? 24,
        dunningEmailDays: (parsed.data.dunningEmailDays ?? [3, 7, 14]) as any,
        gracePeriodDays: parsed.data.gracePeriodDays ?? 7,
        autoResumeOnSuccess: parsed.data.autoResumeOnSuccess ?? true,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error(`Failed to update pledge settings for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'PUT /api/tenants/[tenantId]/donations/pledges/settings', tenantId });
  }
}
