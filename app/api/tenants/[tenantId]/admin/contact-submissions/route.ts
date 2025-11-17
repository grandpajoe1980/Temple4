import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { can } from '@/lib/permissions';

// 17.5 Get Contact Submissions
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
        const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } });
        if (!tenant) {
            return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
        }

        const canViewSubmissions = await can(user, tenant, 'canManageContactSubmissions');
        if (!canViewSubmissions) {
            return NextResponse.json({ message: 'You do not have permission to view contact submissions.' }, { status: 403 });
        }

        const submissions = await prisma.contactSubmission.findMany({
            where: { tenantId: params.tenantId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(submissions);
    } catch (error) {
        console.error(`Failed to fetch contact submissions for tenant ${params.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to fetch contact submissions' }, { status: 500 });
    }
}
