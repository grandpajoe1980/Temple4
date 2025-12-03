import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { forbidden, handleApiError, notFound, unauthorized, validationError } from '@/lib/api-response';
import { getTenantContext } from '@/lib/tenant-context';
import { hasRole } from '@/lib/permissions';
import { MembershipStatus, TenantRole, PledgeFrequency, PledgeStatus } from '@/types';

// Calculate next charge date based on frequency
function calculateNextChargeDate(startDate: Date, frequency: PledgeFrequency): Date {
  const next = new Date(startDate);
  switch (frequency) {
    case PledgeFrequency.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    case PledgeFrequency.BIWEEKLY:
      next.setDate(next.getDate() + 14);
      break;
    case PledgeFrequency.MONTHLY:
      next.setMonth(next.getMonth() + 1);
      break;
    case PledgeFrequency.QUARTERLY:
      next.setMonth(next.getMonth() + 3);
      break;
    case PledgeFrequency.YEARLY:
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

const pledgeSchema = z.object({
  fundId: z.string().min(1, 'Fund is required'),
  amountCents: z.number().int().positive('Amount must be positive'),
  currency: z.string().min(3).max(3).default('USD'),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  paymentMethodToken: z.string().optional(),
  paymentMethodLast4: z.string().max(4).optional(),
  paymentMethodBrand: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  dedicationNote: z.string().max(500).optional(),
});

// GET: List pledges (user sees their own, admin sees all)
export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const context = await getTenantContext(tenantId, userId);
    if (!context) return notFound('Tenant');
    
    const settings = context.tenant.settings;
    if (!settings?.enableDonations || !settings?.enableRecurringPledges) {
      return forbidden('Recurring pledges are not enabled for this tenant');
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const fundId = url.searchParams.get('fundId');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    const isAdmin = userId ? await hasRole(userId, tenantId, [TenantRole.ADMIN]) : false;

    const where: any = { tenantId };
    
    // Non-admins can only see their own pledges
    if (!isAdmin) {
      if (!userId) return unauthorized();
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }
    if (fundId) {
      where.fundId = fundId;
    }

    const [pledges, total] = await Promise.all([
      prisma.pledge.findMany({
        where,
        include: {
          fund: true,
          charges: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pledge.count({ where }),
    ]);

    return NextResponse.json({
      pledges,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(`Failed to fetch pledges for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/donations/pledges', tenantId });
  }
}

// POST: Create a new pledge
export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) return unauthorized();
  const userId = (session.user as any).id;

  try {
    const context = await getTenantContext(tenantId, userId);
    if (!context) return notFound('Tenant');
    
    const settings = context.tenant.settings;
    if (!settings?.enableDonations || !settings?.enableRecurringPledges) {
      return forbidden('Recurring pledges are not enabled for this tenant');
    }

    // Must be an approved member
    if (context.membership?.status !== MembershipStatus.APPROVED) {
      return forbidden('Only approved members can create pledges');
    }

    const body = await request.json();
    const parsed = pledgeSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten().fieldErrors);

    // Verify fund exists and is active
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

    // Validate amount against fund limits
    if (fund.minAmountCents && parsed.data.amountCents < fund.minAmountCents) {
      return validationError({ amountCents: [`Minimum amount is ${fund.minAmountCents / 100} ${fund.currency}`] });
    }
    if (fund.maxAmountCents && parsed.data.amountCents > fund.maxAmountCents) {
      return validationError({ amountCents: [`Maximum amount is ${fund.maxAmountCents / 100} ${fund.currency}`] });
    }

    const startDate = new Date(parsed.data.startDate);
    const nextChargeAt = calculateNextChargeDate(startDate, parsed.data.frequency as PledgeFrequency);

    const pledge = await prisma.pledge.create({
      data: {
        tenantId,
        userId,
        fundId: parsed.data.fundId,
        amountCents: parsed.data.amountCents,
        currency: parsed.data.currency,
        frequency: parsed.data.frequency,
        startDate,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        nextChargeAt,
        paymentMethodToken: parsed.data.paymentMethodToken,
        paymentMethodLast4: parsed.data.paymentMethodLast4,
        paymentMethodBrand: parsed.data.paymentMethodBrand,
        isAnonymous: parsed.data.isAnonymous ?? false,
        dedicationNote: parsed.data.dedicationNote,
        status: 'ACTIVE',
      },
      include: {
        fund: true,
      },
    });

    return NextResponse.json(pledge, { status: 201 });
  } catch (error) {
    console.error(`Failed to create pledge for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/donations/pledges', tenantId });
  }
}
