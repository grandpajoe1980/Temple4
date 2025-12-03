import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { forbidden, handleApiError, notFound, unauthorized } from '@/lib/api-response';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';

// POST: Pause a pledge
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
      return forbidden('You can only pause your own pledges');
    }

    if (pledge.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Only active pledges can be paused' }, { status: 400 });
    }

    const paused = await prisma.pledge.update({
      where: { id: pledgeId },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(),
      },
      include: { fund: true },
    });

    return NextResponse.json(paused);
  } catch (error) {
    console.error(`Failed to pause pledge ${pledgeId}:`, error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/donations/pledges/[pledgeId]/pause', tenantId });
  }
}
