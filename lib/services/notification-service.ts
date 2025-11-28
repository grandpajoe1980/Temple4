import { prisma } from '@/lib/db';
import { assertApprovedMember } from '@/lib/tenant-isolation';

export interface EnqueueParams {
  tenantId?: string;
  type?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  runAt?: Date;
  actorUserId?: string; // optional actor performing the enqueue
}

export async function enqueueNotification(params: EnqueueParams) {
  const { tenantId, type, to, subject, html, text, runAt, actorUserId } = params;

  // If tenant-scoped notification is requested, require an actor and validate membership
  if (tenantId) {
    if (!actorUserId) {
      throw new Error('unauthorized: tenant-scoped enqueue requires actorUserId');
    }
    await assertApprovedMember(actorUserId, tenantId);
  }

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
