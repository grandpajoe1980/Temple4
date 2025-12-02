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

  // Map any legacy or alternative type strings to the Prisma NotificationType enum
  // `NEW_DONATION` was historically used in code but the Prisma enum uses `DONATION_FUND_UPDATED`.
  const mappedType =
    type === 'NEW_DONATION' ? 'DONATION_FUND_UPDATED' : (type as string | undefined) || null;

  return prisma.outbox.create({
    data: {
      tenantId: tenantId || null,
      // cast to any here because Prisma client expects the enum type at runtime
      type: (mappedType as any) || null,
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
