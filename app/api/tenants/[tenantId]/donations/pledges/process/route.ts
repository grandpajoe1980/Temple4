import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { forbidden, handleApiError, unauthorized } from '@/lib/api-response';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { processDuePledges, retryFailedPledges } from '@/lib/services/pledge-scheduler';

// POST: Manually trigger pledge processing (admin only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) return unauthorized();
  const userId = (session.user as any).id;

  try {
    const isAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);
    if (!isAdmin) return forbidden('Only admins can trigger pledge processing');

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'process';

    let results;
    if (action === 'retry') {
      results = await retryFailedPledges(tenantId);
    } else {
      results = await processDuePledges(tenantId);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: `Processed ${results.length} pledges: ${successful} successful, ${failed} failed`,
      results,
    });
  } catch (error) {
    console.error(`Failed to process pledges for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/donations/pledges/process', tenantId });
  }
}
