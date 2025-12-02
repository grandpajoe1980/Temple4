import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { forbidden, handleApiError, notFound, unauthorized, validationError } from '@/lib/api-response';
import { hasRole } from '@/lib/permissions';
import { ActionType, TenantRole } from '@/types';
import { logAuditEvent } from '@/lib/audit';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(['TITHE', 'OFFERING', 'PROJECT', 'SPECIAL']).optional(),
  visibility: z.enum(['PUBLIC', 'MEMBERS_ONLY', 'HIDDEN']).optional(),
  currency: z.string().min(3).max(3).optional(),
  goalAmountCents: z.number().int().nonnegative().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  minAmountCents: z.number().int().nonnegative().nullable().optional(),
  maxAmountCents: z.number().int().nonnegative().nullable().optional(),
  allowAnonymous: z.boolean().optional(),
  campaignMetadata: z.record(z.string(), z.any()).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ tenantId: string; fundId: string }> }) {
  const { tenantId, fundId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorized();
  const userId = (session.user as any).id;

  try {
    const isAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);
    if (!isAdmin) return forbidden('Only admins can update funds');

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten().fieldErrors);

    const fund = await prisma.fund.findFirst({ where: { id: fundId, tenantId } });
    if (!fund) return notFound('Fund');

    if (parsed.data.startDate && parsed.data.endDate) {
      const start = new Date(parsed.data.startDate);
      const end = new Date(parsed.data.endDate);
      if (start > end) {
        return validationError({ startDate: ['Start date must be before end date'] });
      }
    }

    const updated = await prisma.fund.update({
      where: { id: fundId },
      data: {
        ...parsed.data,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : parsed.data.startDate,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : parsed.data.endDate,
      },
    });

    await logAuditEvent({
      actorUserId: userId,
      actionType: ActionType.DONATION_FUND_UPDATED,
      entityType: 'Fund',
      entityId: fundId,
      metadata: { before: fund, after: updated },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`Failed to update fund ${fundId}:`, error);
    return handleApiError(error, { route: 'PATCH /api/tenants/[tenantId]/donations/funds/[fundId]', tenantId, fundId });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ tenantId: string; fundId: string }> }) {
  const { tenantId, fundId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorized();
  const userId = (session.user as any).id;

  try {
    const isAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);
    if (!isAdmin) return forbidden('Only admins can archive funds');

    const fund = await prisma.fund.findFirst({ where: { id: fundId, tenantId } });
    if (!fund) return notFound('Fund');

    const archived = await prisma.fund.update({
      where: { id: fundId },
      data: { archivedAt: new Date() },
    });

    await logAuditEvent({
      actorUserId: userId,
      actionType: ActionType.DONATION_FUND_ARCHIVED,
      entityType: 'Fund',
      entityId: fundId,
      metadata: { fund: archived },
    });

    return NextResponse.json(archived);
  } catch (error) {
    console.error(`Failed to archive fund ${fundId}:`, error);
    return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/donations/funds/[fundId]', tenantId, fundId });
  }
}
