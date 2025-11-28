import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { can } from '@/lib/permissions';
import { z } from 'zod';
import { ContactSubmissionStatus } from '@/types';
import { unauthorized, validationError, notFound, forbidden, handleApiError } from '@/lib/api-response';

const updateSubmissionSchema = z.object({
    status: z.nativeEnum(ContactSubmissionStatus),
});

// 17.6 Update Contact Submission
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; submissionId: string }> }
) {
    const { submissionId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
        return unauthorized();
    }

    const result = updateSubmissionSchema.safeParse(await request.json());
    if (!result.success) {
        return validationError(result.error.flatten().fieldErrors);
    }

    try {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            return notFound('Tenant');
        }

        const canUpdateSubmissions = await can(user, tenant, 'canManageContactSubmissions');
        if (!canUpdateSubmissions) {
            return forbidden('You do not have permission to update contact submissions.');
        }

        const updatedSubmission = await prisma.contactSubmission.update({
            where: { id: submissionId, tenantId: tenantId },
            data: { status: result.data.status },
        });

        return NextResponse.json(updatedSubmission);
    } catch (error) {
        console.error(`Failed to update contact submission ${submissionId}:`, error);
        return handleApiError(error, { route: 'PUT /api/tenants/[tenantId]/admin/contact-submissions/[submissionId]', tenantId, submissionId });
    }
}
