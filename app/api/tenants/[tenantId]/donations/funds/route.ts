import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { forbidden, handleApiError, notFound, unauthorized, validationError } from '@/lib/api-response';
import { getTenantContext } from '@/lib/tenant-context';
import { hasRole } from '@/lib/permissions';
import { FundVisibility, MembershipStatus, TenantRole, ActionType } from '@/types';
import { logAuditEvent } from '@/lib/audit';

const fundSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().max(500).optional(),
  type: z.enum(['TITHE', 'OFFERING', 'PROJECT', 'SPECIAL']),
  visibility: z.enum(['PUBLIC', 'MEMBERS_ONLY', 'HIDDEN']).default('PUBLIC'),
  currency: z.string().min(3).max(3),
  goalAmountCents: z.number().int().nonnegative().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  minAmountCents: z.number().int().nonnegative().nullable().optional(),
  maxAmountCents: z.number().int().nonnegative().nullable().optional(),
  allowAnonymous: z.boolean().optional(),
  campaignMetadata: z.record(z.any()).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const context = await getTenantContext(tenantId, userId);
    if (!context) return notFound('Tenant');
    if (!context.tenant.settings?.enableDonations) return forbidden('Donations are not enabled for this tenant');

    const url = new URL(request.url);
    const includeArchived = url.searchParams.get('includeArchived') === 'true';
    const isAdmin = userId ? await hasRole(userId, tenantId, [TenantRole.ADMIN]) : false;

    const where: any = {
      tenantId,
      ...(includeArchived && isAdmin ? {} : { archivedAt: null }),
    };

    const isApprovedMember = context.membership?.status === MembershipStatus.APPROVED;
    if (!isAdmin) {
      where.visibility = isApprovedMember ? { not: 'HIDDEN' as FundVisibility } : 'PUBLIC';
    }

    const funds = await prisma.fund.findMany({ where, orderBy: { createdAt: 'desc' } });

    if (funds.length === 0) return NextResponse.json([]);

    const totals = await prisma.donationRecord.groupBy({
      by: ['fundId'],
      _sum: { amount: true },
      where: { tenantId, fundId: { in: funds.map((fund) => fund.id) } },
    });

    const withProgress = funds.map((fund) => {
      const sum = totals.find((t) => t.fundId === fund.id)?._sum.amount ?? 0;
      return {
        ...fund,
        amountRaisedCents: Math.round(sum * 100),
      };
    });

    return NextResponse.json(withProgress);
  } catch (error) {
    console.error(`Failed to fetch funds for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/donations/funds', tenantId });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) return unauthorized();
  const userId = (session.user as any).id;

  try {
    const isAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);
    if (!isAdmin) return forbidden('Only admins can create funds');

    const body = await request.json();
    const parsed = fundSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten().fieldErrors);

    if (parsed.data.startDate && parsed.data.endDate) {
      const start = new Date(parsed.data.startDate);
      const end = new Date(parsed.data.endDate);
      if (start > end) {
        return validationError({ startDate: ['Start date must be before end date'] });
      }
    }

    const fund = await prisma.fund.create({
      data: {
        tenantId,
        name: parsed.data.name,
        description: parsed.data.description,
        type: parsed.data.type,
        visibility: parsed.data.visibility,
        currency: parsed.data.currency,
        goalAmountCents: parsed.data.goalAmountCents ?? null,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        minAmountCents: parsed.data.minAmountCents ?? null,
        maxAmountCents: parsed.data.maxAmountCents ?? null,
        allowAnonymous: parsed.data.allowAnonymous ?? true,
        campaignMetadata: parsed.data.campaignMetadata as any,
      },
    });

    await logAuditEvent({
      actorUserId: userId,
      actionType: ActionType.DONATION_FUND_CREATED,
      entityType: 'Fund',
      entityId: fund.id,
      metadata: { fund },
    });

    await prisma.notification.createMany({
      data: [
        {
          userId,
          actorUserId: userId,
          type: 'DONATION_FUND_UPDATED',
          message: `Fund created: ${fund.name}`,
          link: `/tenants/${tenantId}/donations`,
        },
      ],
    });

    return NextResponse.json(fund, { status: 201 });
  } catch (error) {
    console.error(`Failed to create fund for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/donations/funds', tenantId });
  }
}
