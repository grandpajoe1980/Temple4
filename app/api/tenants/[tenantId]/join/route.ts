import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MembershipStatus, MembershipApprovalMode, TenantRole } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const tenantId = params.tenantId;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true },
    });

    if (!tenant) {
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
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
      return NextResponse.json({ message: 'You are already a member or have a pending request.' }, { status: 400 });
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
    return NextResponse.json({ message: 'Failed to join tenant' }, { status: 500 });
  }
}
