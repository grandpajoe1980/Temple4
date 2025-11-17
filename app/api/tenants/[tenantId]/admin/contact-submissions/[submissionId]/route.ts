import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { can } from '@/lib/permissions';
import { z } from 'zod';
import { ContactSubmissionStatus } from '@prisma/client';

const updateSubmissionSchema = z.object({
    status: z.nativeEnum(ContactSubmissionStatus),
});

// 17.6 Update Contact Submission
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; submissionId: string }> }
) {
    const { tenantId, submissionId } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const result = updateSubmissionSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
        }

        const canUpdateSubmissions = await can(user.id, tenant, 'canManageContactSubmissions');
        if (!canUpdateSubmissions) {
            return NextResponse.json({ message: 'You do not have permission to update contact submissions.' }, { status: 403 });
        }

        const updatedSubmission = await prisma.contactSubmission.update({
            where: { id: submissionId, tenantId: tenantId },
            data: { status: result.data.status },
        });

        return NextResponse.json(updatedSubmission);
    } catch (error) {
        console.error(`Failed to update contact submission ${submissionId}:`, error);
        return NextResponse.json({ message: 'Failed to update contact submission' }, { status: 500 });
    }
}
