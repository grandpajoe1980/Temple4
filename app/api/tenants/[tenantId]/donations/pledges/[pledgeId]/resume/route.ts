import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { forbidden, handleApiError, notFound, unauthorized } from '@/lib/api-response';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';

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

// POST: Resume a paused pledge
export async function POST(
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
      return forbidden('You can only resume your own pledges');
    }

    if (pledge.status !== 'PAUSED' && pledge.status !== 'FAILED') {
      return NextResponse.json({ error: 'Only paused or failed pledges can be resumed' }, { status: 400 });
    }

    // Calculate new next charge date from today
    const nextChargeAt = calculateNextChargeDate(new Date(), pledge.frequency);

    const resumed = await prisma.pledge.update({
      where: { id: pledgeId },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
        failureCount: 0, // Reset failure count on resume
        nextChargeAt,
      },
      include: { fund: true },
    });

    return NextResponse.json(resumed);
  } catch (error) {
    console.error(`Failed to resume pledge ${pledgeId}:`, error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/donations/pledges/[pledgeId]/resume', tenantId });
  }
}
