import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { can } from '@/lib/permissions';
import { unauthorized, notFound, forbidden, handleApiError } from '@/lib/api-response';

// 17.5 Get Contact Submissions
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
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            return notFound('Tenant');
        }

        const canViewSubmissions = await can(user, tenant, 'canManageContactSubmissions');
        if (!canViewSubmissions) {
            return forbidden('You do not have permission to view contact submissions.');
        }

        const submissions = await prisma.contactSubmission.findMany({
            where: { tenantId: tenantId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(submissions);
    } catch (error) {
        console.error(`Failed to fetch contact submissions for tenant ${tenantId}:`, error);
        return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/admin/contact-submissions', tenantId });
    }
}
