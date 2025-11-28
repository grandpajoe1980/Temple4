import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MembershipStatus, MembershipApprovalMode,  } from '@/types';
import { TenantRole } from '@/types';
import { handleApiError, unauthorized, notFound, validationError } from '@/lib/api-response';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return unauthorized();
  }

  const userId = (session.user as any).id;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true },
    });

    if (!tenant) {
      return notFound('Tenant');
    }

    const existingMembership = await prisma.userTenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    if (existingMembership) {
      return validationError({ membership: ['You are already a member or have a pending request.'] });
    }

    const status =
      tenant.settings?.membershipApprovalMode === MembershipApprovalMode.APPROVAL_REQUIRED
        ? MembershipStatus.PENDING
        : MembershipStatus.APPROVED;

    await prisma.userTenantMembership.create({
      data: {
        userId,
        tenantId,
        status,
        roles: {
            create: {
                role: TenantRole.MEMBER,
                isPrimary: true,
            }
        }
      },
    });

    return NextResponse.json({ message: 'Successfully joined tenant', status });
  } catch (error) {
    console.error('Failed to join tenant:', error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/join', tenantId });
  }
}
