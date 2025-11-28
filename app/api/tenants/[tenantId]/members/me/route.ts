import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { unauthorized, handleApiError } from '@/lib/api-response';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return unauthorized();
  }

  try {
    const membership = await prisma.userTenantMembership.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
      include: { roles: true },
    });

    return NextResponse.json({ membership });
  } catch (error) {
    console.error(`Failed to fetch membership for user ${userId} in tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/members/me', tenantId, userId });
  }
}
