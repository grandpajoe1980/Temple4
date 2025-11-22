import { prisma } from './db';
import { sendEmail } from './email';
import { logger } from './logger';

const DEFAULT_BACKOFF_MS = 1000 * 30; // 30s
const MAX_ATTEMPTS = 5;

export async function processNextOutboxItem(): Promise<boolean> {
  // find a pending outbox item scheduled to run
  const item = await prisma.outbox.findFirst({
    where: {
      status: 'PENDING',
      runAt: { lte: new Date() },
    },
    orderBy: { runAt: 'asc' },
  });

  if (!item) return false;

  try {
    // mark as processing and increment attempts
    await prisma.outbox.update({
      where: { id: item.id },
      data: { status: 'PROCESSING', attempts: { increment: 1 }, lockedAt: new Date() },
    });

    const payload = item.payload as any;

    // payload expected shape: { to, subject, html, text, tenantId }
    const result = await sendEmail({
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      tenantId: item.tenantId || payload.tenantId,
    });

    if (result.success) {
      await prisma.outbox.update({
        where: { id: item.id },
        data: { status: 'SENT', processedAt: new Date(), provider: result.providerId },
      });
      logger.info('Outbox item sent', { id: item.id });
    } else {
      const attempts = (item.attempts ?? 0) + 1;
      const willFail = attempts >= MAX_ATTEMPTS;

      await prisma.outbox.update({
        where: { id: item.id },
        data: {
          status: willFail ? 'FAILED' : 'PENDING',
          lastError: result.error,
          runAt: willFail ? item.runAt : new Date(Date.now() + DEFAULT_BACKOFF_MS * attempts),
        },
      });

      logger.warn('Outbox send failed', { id: item.id, error: result.error });
    }

    return true;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    await prisma.outbox.update({ where: { id: item.id }, data: { status: 'PENDING', lastError: errMsg } });
    logger.error('Outbox processing error', { id: item.id, error: errMsg });
    return true;
  }
}

export function startOutboxWorker(opts?: { intervalMs?: number; stopSignal?: { stop: boolean } }) {
  const intervalMs = opts?.intervalMs ?? 5000;
  const stopSignal = opts?.stopSignal;

  let running = true;

  async function loop() {
    while (running && !(stopSignal && stopSignal.stop)) {
      try {
        const didWork = await processNextOutboxItem();
        if (!didWork) await new Promise((r) => setTimeout(r, intervalMs));
      } catch (err) {
        logger.error('Outbox worker loop error', { error: err });
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    }
  }

  loop();

  return () => { running = false; };
}

const OutboxWorker = { processNextOutboxItem, startOutboxWorker };

export default OutboxWorker;
