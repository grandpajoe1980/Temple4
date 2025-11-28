import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { unauthorized, forbidden, handleApiError } from '@/lib/api-response';

// 17.7 Get Audit Logs
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
        return unauthorized();
    }

    try {
        const isAdmin = await hasRole(user.id, tenantId, [TenantRole.ADMIN]);
        if (!isAdmin) {
            return forbidden('You do not have permission to view audit logs.');
        }

        const auditLogs = await prisma.auditLog.findMany({
            // This is a simplified query. In a real app, you'd probably want to filter by entityType/entityId
            // that are relevant to the current tenant. This would require schema changes.
            // For now, we return all audit logs.
            orderBy: { createdAt: 'desc' },
            include: {
                actorUser: { select: { id: true, profile: true } },
                effectiveUser: { select: { id: true, profile: true } },
            }
        });

        return NextResponse.json(auditLogs);
    } catch (error) {
        console.error(`Failed to fetch audit logs for tenant ${tenantId}:`, error);
        return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/admin/audit-logs', tenantId });
    }
}
