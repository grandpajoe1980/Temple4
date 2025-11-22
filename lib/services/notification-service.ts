import { prisma } from '@/lib/db';

export interface EnqueueParams {
  tenantId?: string;
  type?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  runAt?: Date;
}

export async function enqueueNotification(params: EnqueueParams) {
  const { tenantId, type, to, subject, html, text, runAt } = params;

  return prisma.outbox.create({
    data: {
      tenantId: tenantId || null,
      type: (type as any) || null,
      payload: {
        to,
        subject,
        html,
        text,
      },
      runAt: runAt || new Date(),
    },
  });
}

const NotificationService = { enqueueNotification };

export default NotificationService;
