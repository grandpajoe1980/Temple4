import { withErrorHandling } from '@/lib/api-response';
import { NextResponse } from 'next/server';
import { requireSuperAdminForApi } from '@/lib/middleware/requireRole';
import { sendEmail } from '@/lib/email';

export const POST = withErrorHandling(async (req: Request) => {
  const authCheck = await requireSuperAdminForApi(req as any);
  if (authCheck) return authCheck;

  const body = await req.json();
  const to = body?.to;
  if (!to || typeof to !== 'string') return NextResponse.json({ message: 'recipient email required' }, { status: 400 });

  const result = await sendEmail({
    to,
    subject: 'Temple Platform — Test Email',
    html: `<div style="font-family: Arial, sans-serif; padding:20px;"><h2 style="color:#1f2937">Temple Platform</h2><p>This is a test email sent from the administrative Email Configuration page.</p></div>`,
    text: 'This is a test email sent from the administrative Email Configuration page.',
  });

  if (result.success) {
    return NextResponse.json({ ok: true, data: { providerId: result.providerId } });
  }

  return NextResponse.json({ ok: false, error: result.error || 'send failed' }, { status: 500 });
});
