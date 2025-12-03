import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { forbidden, handleApiError, notFound, unauthorized, validationError } from '@/lib/api-response';
import { hasRole } from '@/lib/permissions';
import { TenantRole, PledgeFrequency } from '@/types';

// Calculate next charge date based on frequency
function calculateNextChargeDate(fromDate: Date, frequency: string): Date {
  const next = new Date(fromDate);
  switch (frequency) {
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

const updateSchema = z.object({
  amountCents: z.number().int().positive().optional(),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  fundId: z.string().optional(),
  endDate: z.string().datetime().nullable().optional(),
  paymentMethodToken: z.string().optional(),
  paymentMethodLast4: z.string().max(4).optional(),
  paymentMethodBrand: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  dedicationNote: z.string().max(500).optional(),
});

const adminOverrideSchema = z.object({
  nextChargeAt: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED', 'FAILED', 'COMPLETED']).optional(),
  failureCount: z.number().int().nonnegative().optional(),
});

// GET: Get a specific pledge
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; pledgeId: string }> }
) {
  const { tenantId, pledgeId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const pledge = await prisma.pledge.findFirst({
      where: { id: pledgeId, tenantId },
      include: {
        fund: true,
        charges: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!pledge) return notFound('Pledge');

    const isAdmin = userId ? await hasRole(userId, tenantId, [TenantRole.ADMIN]) : false;

    // Only the owner or admin can view
    if (!isAdmin && pledge.userId !== userId) {
      return forbidden('You can only view your own pledges');
    }

    return NextResponse.json(pledge);
  } catch (error) {
    console.error(`Failed to fetch pledge ${pledgeId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/donations/pledges/[pledgeId]', tenantId });
  }
}

// PUT: Update a pledge (user can update their own, admin can override)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; pledgeId: string }> }
) {
  const { tenantId, pledgeId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) return unauthorized();
  const userId = (session.user as any).id;

  try {
    const pledge = await prisma.pledge.findFirst({
      where: { id: pledgeId, tenantId },
    });

    if (!pledge) return notFound('Pledge');

    const isAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);
    const isOwner = pledge.userId === userId;

    if (!isAdmin && !isOwner) {
      return forbidden('You can only update your own pledges');
    }

    const body = await request.json();

    // Admin can use override fields
    if (isAdmin && body.adminOverride) {
      const parsed = adminOverrideSchema.safeParse(body.adminOverride);
      if (!parsed.success) return validationError(parsed.error.flatten().fieldErrors);

      const updated = await prisma.pledge.update({
        where: { id: pledgeId },
        data: {
          ...(parsed.data.nextChargeAt && { nextChargeAt: new Date(parsed.data.nextChargeAt) }),
          ...(parsed.data.status && { status: parsed.data.status }),
          ...(parsed.data.failureCount !== undefined && { failureCount: parsed.data.failureCount }),
        },
        include: { fund: true },
      });

      return NextResponse.json(updated);
    }

    // Regular update
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten().fieldErrors);

    // Verify fund if changed
    if (parsed.data.fundId) {
      const fund = await prisma.fund.findFirst({
        where: {
          id: parsed.data.fundId,
          tenantId,
          archivedAt: null,
        },
      });
      if (!fund) {
        return validationError({ fundId: ['Fund not found or is archived'] });
      }
    }

    const updateData: any = { ...parsed.data };
    if (parsed.data.endDate) {
      updateData.endDate = new Date(parsed.data.endDate);
    } else if (parsed.data.endDate === null) {
      updateData.endDate = null;
    }

    const updated = await prisma.pledge.update({
      where: { id: pledgeId },
      data: updateData,
      include: { fund: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`Failed to update pledge ${pledgeId}:`, error);
    return handleApiError(error, { route: 'PUT /api/tenants/[tenantId]/donations/pledges/[pledgeId]', tenantId });
  }
}

// DELETE: Cancel a pledge (soft delete by setting status)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; pledgeId: string }> }
) {
  const { tenantId, pledgeId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) return unauthorized();
  const userId = (session.user as any).id;

  try {
    const pledge = await prisma.pledge.findFirst({
      where: { id: pledgeId, tenantId },
    });

    if (!pledge) return notFound('Pledge');

    const isAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);
    const isOwner = pledge.userId === userId;

    if (!isAdmin && !isOwner) {
      return forbidden('You can only cancel your own pledges');
    }

    const cancelled = await prisma.pledge.update({
      where: { id: pledgeId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json(cancelled);
  } catch (error) {
    console.error(`Failed to cancel pledge ${pledgeId}:`, error);
    return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/donations/pledges/[pledgeId]', tenantId });
  }
}
