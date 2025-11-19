import { prisma } from './db';
import { User, ImpersonationSession } from '@prisma/client';
import { ActionType } from '@/types';
import { logAuditEvent } from './audit';

/**
 * Start an impersonation session
 * Only super admins can impersonate
 */
export async function startImpersonation(
  adminUserId: string,
  targetUserId: string,
  tenantId?: string,
  reason?: string
): Promise<{ success: boolean; session?: ImpersonationSession; error?: string }> {
  try {
    // Verify admin is a super admin
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!admin || !admin.isSuperAdmin) {
      return { success: false, error: 'Only super admins can impersonate users' };
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return { success: false, error: 'Target user not found' };
    }

    // Check if there's already an active impersonation session
    const existingSession = await prisma.impersonationSession.findFirst({
      where: {
        realUserId: adminUserId,
        endedAt: null,
      },
    });

    if (existingSession) {
      // Automatically end the existing session so we can start the new one
      console.log(`Ending existing impersonation session ${existingSession.id} for user ${adminUserId}`);
      await endImpersonation(existingSession.id);
    }

    // Create impersonation session
    const session = await prisma.impersonationSession.create({
      data: {
        realUserId: adminUserId,
        effectiveUserId: targetUserId,
        tenantId,
        reason,
      },
    });

    // Log audit event
    await logAuditEvent({
      actorUserId: adminUserId,
      effectiveUserId: targetUserId,
      actionType: ActionType.ADMIN_UPDATED_USER_PROFILE, // Using closest available enum
      entityType: 'IMPERSONATION_SESSION',
      entityId: session.id,
      metadata: { action: 'impersonation_started', reason },
    });

    console.log(`Impersonation started: ${admin.email} -> ${targetUser.email}`);

    return { success: true, session };
  } catch (error) {
    console.error('Failed to start impersonation:', error);
    return { success: false, error: 'Failed to start impersonation' };
  }
}

/**
 * End an impersonation session
 */
export async function endImpersonation(sessionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await prisma.impersonationSession.findUnique({
      where: { id: sessionId },
      include: {
        realUser: true,
        effectiveUser: true,
      },
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.endedAt) {
      return { success: false, error: 'Session already ended' };
    }

    // End the session
    await prisma.impersonationSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });

    // Log audit event
    await logAuditEvent({
      actorUserId: session.realUserId,
      effectiveUserId: session.effectiveUserId,
      actionType: ActionType.ADMIN_UPDATED_USER_PROFILE,
      entityType: 'IMPERSONATION_SESSION',
      entityId: sessionId,
      metadata: { action: 'impersonation_ended' },
    });

    console.log(`Impersonation ended: ${session.realUser.email} -> ${session.effectiveUser.email}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to end impersonation:', error);
    return { success: false, error: 'Failed to end impersonation' };
  }
}

/**
 * Get active impersonation session for a user
 */
export async function getActiveImpersonation(
  adminUserId: string
): Promise<ImpersonationSession | null> {
  try {
    return await prisma.impersonationSession.findFirst({
      where: {
        realUserId: adminUserId,
        endedAt: null,
      },
      include: {
        effectiveUser: {
          include: {
            profile: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to get active impersonation:', error);
    return null;
  }
}

/**
 * Get the effective user ID (impersonated user if active, otherwise real user)
 * This should be used in API routes and server components
 */
export async function getEffectiveUserId(realUserId: string): Promise<string> {
  const activeImpersonation = await getActiveImpersonation(realUserId);
  return activeImpersonation ? activeImpersonation.effectiveUserId : realUserId;
}

/**
 * Get the effective user object
 */
export async function getEffectiveUser(realUserId: string): Promise<User | null> {
  const effectiveUserId = await getEffectiveUserId(realUserId);
  return await prisma.user.findUnique({
    where: { id: effectiveUserId },
    include: {
      profile: true,
      privacySettings: true,
      accountSettings: true,
    },
  });
}
