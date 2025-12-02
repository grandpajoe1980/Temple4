import { MembershipStatus, OnboardingStatus } from '@/types';
import { TenantSettings as PrismaTenantSettings } from '@prisma/client';
import { sendWelcomePacketEmail } from '@/lib/email';
import NotificationService from '@/lib/services/notification-service';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

type OnboardingInputs = {
  status: MembershipStatus;
  settings?: PrismaTenantSettings | null;
};

function toStringArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((entry): entry is string => typeof entry === 'string');
      }
    } catch {
      // Ignore parse errors and fall back to empty
    }
  }

  return [];
}

export function deriveOnboardingFields({ status, settings }: OnboardingInputs) {
  const welcomePacketUrl = settings?.welcomePacketUrl ?? null;
  const welcomePacketVersion = welcomePacketUrl
    ? settings?.welcomePacketVersion ?? 1
    : null;
  const alertChannels = toStringArray(settings?.newMemberAlertChannels);

  const onboardingStatus =
    status === MembershipStatus.APPROVED && welcomePacketUrl
      ? OnboardingStatus.PACKET_QUEUED
      : OnboardingStatus.PENDING;

  const alertSentAt =
    status === MembershipStatus.APPROVED && alertChannels.length > 0
      ? new Date()
      : null;

  return {
    welcomePacketUrl,
    welcomePacketVersion,
    onboardingStatus,
    alertSentAt,
    alertChannels,
  };
}

/**
 * Send welcome email to a newly approved member.
 * This function is fire-and-forget - errors are logged but don't block the main flow.
 */
export async function sendWelcomeEmail(params: {
  userId: string;
  tenantId: string;
  welcomePacketUrl?: string | null;
}): Promise<void> {
  const { userId, tenantId, welcomePacketUrl } = params;

  try {
    // Fetch user and tenant info
    const [user, tenant] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      }),
    ]);

    if (!user || !tenant) {
      logger.warn('Cannot send welcome email - user or tenant not found', { userId, tenantId });
      return;
    }

    await sendWelcomePacketEmail({
      email: user.email,
      displayName: user.profile?.displayName,
      tenantName: tenant.name,
      welcomePacketUrl,
      tenantId,
    });

    logger.info('Welcome email sent successfully', { userId, tenantId });
  } catch (error) {
    logger.error('Failed to send welcome email', { 
      userId, 
      tenantId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    // Don't rethrow - this is a non-blocking operation
  }
}

/**
 * Notify staff/admins about a newly approved member.
 * This function sends notifications to all admins and moderators of the tenant.
 */
export async function notifyStaffOfNewMember(params: {
  userId: string;
  tenantId: string;
  approvedByUserId: string;
}): Promise<void> {
  const { userId, tenantId, approvedByUserId } = params;

  try {
    // Fetch the new member info
    const [newMember, tenant] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, slug: true },
      }),
    ]);

    if (!newMember || !tenant) {
      logger.warn('Cannot notify staff - member or tenant not found', { userId, tenantId });
      return;
    }

    // Find all staff/admins to notify (excluding the approver)
    const staffMemberships = await prisma.userTenantMembership.findMany({
      where: {
        tenantId,
        status: 'APPROVED',
        userId: { not: approvedByUserId }, // Don't notify the person who approved
        roles: {
          some: {
            role: { in: ['ADMIN', 'STAFF', 'MODERATOR'] },
          },
        },
      },
      select: {
        userId: true,
      },
    });

    if (staffMemberships.length === 0) {
      logger.debug('No staff to notify about new member', { tenantId });
      return;
    }

    const memberName = newMember.profile?.displayName || newMember.email;
    const message = `New member approved: ${memberName} has joined ${tenant.name}`;

    // Send notifications to all staff
    await Promise.all(
      staffMemberships.map((membership) =>
        NotificationService.enqueueNotification({
          tenantId,
          actorUserId: approvedByUserId,
          to: membership.userId,
          type: 'MEMBERSHIP_APPROVED',
          subject: `New Member: ${memberName}`,
          html: message,
        }).catch((err) => {
          logger.error('Failed to send staff notification', {
            userId: membership.userId,
            error: err instanceof Error ? err.message : String(err),
          });
        })
      )
    );

    logger.info('Staff notifications sent for new member', { 
      newMemberId: userId, 
      tenantId, 
      notifiedCount: staffMemberships.length 
    });
  } catch (error) {
    logger.error('Failed to notify staff of new member', { 
      userId, 
      tenantId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    // Don't rethrow - this is a non-blocking operation
  }
}

/**
 * Complete onboarding process for an approved member.
 * This handles sending welcome email and notifying staff.
 */
export async function processApprovedMember(params: {
  userId: string;
  tenantId: string;
  approvedByUserId: string;
  welcomePacketUrl?: string | null;
}): Promise<void> {
  const { userId, tenantId, approvedByUserId, welcomePacketUrl } = params;

  // These are fire-and-forget - run in parallel
  await Promise.allSettled([
    sendWelcomeEmail({ userId, tenantId, welcomePacketUrl }),
    notifyStaffOfNewMember({ userId, tenantId, approvedByUserId }),
  ]);
}
