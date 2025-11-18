/**
 * Storage Info API Route (Phase F2)
 * 
 * GET /api/upload/storage-info?tenantId={tenantId}
 * 
 * Returns storage usage information for a tenant.
 * Accessible by any member of the tenant.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getTenantStorageInfo } from '@/lib/storage';
import { prisma } from '@/lib/db';
import { unauthorized, validationError, handleApiError, notFound } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorized();
    }

    const userId = (session.user as any).id as string;

    // Get tenant ID from query params
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    // Validation
    if (!tenantId) {
      return validationError({ tenantId: ['Tenant ID is required'] });
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return notFound('Tenant');
    }

    // Check if user is a member of this tenant
    const membership = await prisma.userTenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    if (!membership || membership.status !== 'APPROVED') {
      return NextResponse.json(
        { message: 'You are not a member of this tenant' },
        { status: 403 }
      );
    }

    // Get storage info
    const storageInfo = await getTenantStorageInfo(tenantId);

    return NextResponse.json(storageInfo);
  } catch (error) {
    return handleApiError(error, {
      route: 'GET /api/upload/storage-info',
    });
  }
}
