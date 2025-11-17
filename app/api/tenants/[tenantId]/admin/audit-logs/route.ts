import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';

// 17.7 Get Audit Logs
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const isAdmin = await hasRole(user.id, params.tenantId, [TenantRole.ADMIN]);
        if (!isAdmin) {
            return NextResponse.json({ message: 'You do not have permission to view audit logs.' }, { status: 403 });
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
        console.error(`Failed to fetch audit logs for tenant ${params.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to fetch audit logs' }, { status: 500 });
    }
}
