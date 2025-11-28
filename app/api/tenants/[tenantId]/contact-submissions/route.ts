import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { ContactSubmissionStatus } from '@prisma/client';
import { handleApiError, validationError } from '@/lib/api-response';

const contactSubmissionSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const parsed = contactSubmissionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  try {
    const submission = await prisma.contactSubmission.create({
      data: {
        tenantId,
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
        status: ContactSubmissionStatus.UNREAD,
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error(`Failed to create contact submission for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/contact-submissions', tenantId });
  }
}
