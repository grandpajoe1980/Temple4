import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { handleApiError } from '@/lib/api-response';
import { z } from 'zod';
import { VanityDomainStatus } from '@prisma/client';

const statusSchema = z.object({
  action: z.enum(['enable', 'disable']),
  reason: z.string().max(500).optional(),
});

// POST: Enable or disable a domain
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; domainId: string }> }
) {
  try {
    const { tenantId, domainId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const membership = await prisma.userTenantMembership.findFirst({
      where: { userId: session.user.id, tenantId },
      include: { roles: true },
    });

    const isAdmin = membership?.roles?.some(r => r.role === 'ADMIN') ?? false;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const domain = await prisma.vanityDomain.findFirst({
      where: { id: domainId, tenantId, deletedAt: null },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const body = await req.json();
    const { action, reason } = statusSchema.parse(body);

    if (action === 'disable') {
      const updatedDomain = await prisma.vanityDomain.update({
        where: { id: domainId },
        data: {
          status: 'DISABLED',
          disabledAt: new Date(),
          disabledReason: reason || 'Disabled by admin',
        },
      });

      return NextResponse.json({
        domain: updatedDomain,
        message: 'Domain has been disabled',
      });
    } else {
      // Re-enable domain
      // Determine the status based on verification state
      let newStatus: VanityDomainStatus = VanityDomainStatus.PENDING_VERIFICATION;
      if (domain.verifiedAt) {
        if (domain.sslExpiresAt && domain.sslExpiresAt > new Date()) {
          newStatus = VanityDomainStatus.ACTIVE;
        } else if (domain.sslStatus === 'active') {
          newStatus = VanityDomainStatus.ACTIVE;
        } else {
          newStatus = VanityDomainStatus.DNS_VERIFIED;
        }
      }

      const updatedDomain = await prisma.vanityDomain.update({
        where: { id: domainId },
        data: {
          status: newStatus,
          disabledAt: null,
          disabledReason: null,
        },
      });

      return NextResponse.json({
        domain: updatedDomain,
        message: `Domain has been enabled with status: ${newStatus}`,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
