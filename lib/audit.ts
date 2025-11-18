import { prisma } from './db';
import { ActionType } from '@prisma/client';

/**
 * Logs an audit event to the AuditLog table
 */
export async function logAuditEvent(params: {
  actorUserId: string;
  effectiveUserId?: string | null;
  actionType: ActionType;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        effectiveUserId: params.effectiveUserId || params.actorUserId,
        actionType: params.actionType,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ? params.metadata : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break the main flow
  }
}
