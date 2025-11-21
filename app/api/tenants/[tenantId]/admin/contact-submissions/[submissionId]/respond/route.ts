import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { can } from '@/lib/permissions';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';

const respondSchema = z.object({ response: z.string().min(1) });

// POST /api/tenants/[tenantId]/admin/contact-submissions/[submissionId]/respond
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; submissionId: string }> }
) {
  const { tenantId, submissionId } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const result = respondSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });

    const isAllowed = await can(user, tenant, 'canManageContactSubmissions');
    if (!isAllowed) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const submission = await prisma.contactSubmission.findUnique({ where: { id: submissionId } });
    if (!submission) return NextResponse.json({ message: 'Submission not found' }, { status: 404 });

    // Mark as read
    await prisma.contactSubmission.update({ where: { id: submissionId }, data: { status: 'READ' } });

    // Send response email to the submitter
    await sendEmail({
      to: submission.email,
      subject: `Re: Your inquiry to ${tenant.name}`,
      html: `<p>${result.data.response}</p>`,
      text: result.data.response,
      tenantId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to respond to contact submission:', error);
    return NextResponse.json({ message: 'Failed to send response' }, { status: 500 });
  }
}
