import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import NotificationService from '@/lib/services/notification-service';
import { canUserViewContent } from '@/lib/permissions';
import { z } from 'zod';
import { DonationSettings, MembershipStatus } from '@/types';
import { getTenantContext } from '@/lib/tenant-context';
import { notFound, forbidden, validationError, handleApiError } from '@/lib/api-response';

const donationRecordSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3),
  displayName: z.string().min(1, 'Display name is required'),
  isAnonymousOnLeaderboard: z.boolean().default(false),
  message: z.string().max(500).optional(),
});

// GET /api/tenants/[tenantId]/donations/records - List donation records (for leaderboard)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const context = await getTenantContext(tenantId, userId);

    if (!context) {
      return notFound('Tenant');
    }

    if (!context.tenant.settings?.enableDonations) {
      return forbidden('Donations are not enabled for this tenant');
    }

    const donationSettings = context.tenant.settings
      ?.donationSettings as DonationSettings | null;

    if (!donationSettings) {
      return notFound('Donation settings');
    }

    // Check leaderboard visibility
    if (donationSettings.leaderboardVisibility === 'MEMBERS_ONLY') {
      const canView = await canUserViewContent(userId, tenantId, 'posts');
      const isApprovedMember =
        context.membership?.status === MembershipStatus.APPROVED;

      if (!canView || !isApprovedMember) {
        return forbidden('You must be a member to view the donation leaderboard');
      }
    }

    if (!donationSettings.leaderboardEnabled) {
      return forbidden('Leaderboard is not enabled');
    }

    // Calculate date filter based on timeframe
    let dateFilter: any = {};
    const now = new Date();
    
    if (donationSettings.leaderboardTimeframe === 'MONTHLY') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { gte: startOfMonth };
    } else if (donationSettings.leaderboardTimeframe === 'YEARLY') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      dateFilter = { gte: startOfYear };
    }

    // Fetch donation records
    const donations = await prisma.donationRecord.findMany({
      where: {
        tenantId,
        ...(Object.keys(dateFilter).length > 0 && { donatedAt: dateFilter })
      },
      select: {
        id: true,
        displayName: true,
        amount: true,
        currency: true,
        donatedAt: true,
        isAnonymousOnLeaderboard: true,
        message: true,
      },
      orderBy: {
        amount: 'desc'
      },
      take: 100 // Top 100 donors
    });

    // Filter out names for anonymous donations
    const leaderboard = donations.map((donation: any) => ({
      ...donation,
      displayName: donation.isAnonymousOnLeaderboard ? 'Anonymous' : donation.displayName
    }));

    return NextResponse.json({
      leaderboard,
      timeframe: donationSettings.leaderboardTimeframe,
    });
  } catch (error) {
    console.error(`Failed to fetch donation records for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/donations/records', tenantId });
  }
}

// POST /api/tenants/[tenantId]/donations/records - Record a new donation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const context = await getTenantContext(tenantId, userId);

    if (!context) {
      return notFound('Tenant');
    }

    if (!context.tenant.settings?.enableDonations) {
      return forbidden('Donations are not enabled for this tenant');
    }

    const donationSettings = context.tenant.settings
      ?.donationSettings as DonationSettings | null;

    if (!donationSettings) {
      return notFound('Donation settings');
    }

    const isApprovedMember = context.membership?.status === MembershipStatus.APPROVED;
    if (!context.isPublic && !isApprovedMember) {
      return forbidden('Membership approval is required to donate to this tenant');
    }

    // Validate input
    const body = await request.json();
    const result = donationRecordSchema.safeParse(body);

    if (!result.success) {
      return validationError(result.error.flatten().fieldErrors);
    }

    const { amount, currency, displayName, isAnonymousOnLeaderboard, message } = result.data;

    // Validate currency matches settings
    if (currency !== donationSettings.currency) {
      return validationError({ currency: [`Currency must be ${donationSettings.currency}`] });
    }

    // Validate amount is allowed
    if (!donationSettings.allowCustomAmounts && !donationSettings.suggestedAmounts.includes(amount)) {
      return validationError({ amount: ['Amount must be one of the suggested amounts'] });
    }

    // In a real implementation, this would integrate with Stripe/PayPal
    // For now, we just record the donation
    const donation = await prisma.donationRecord.create({
      data: {
        tenantId,
        userId,
        displayName,
        amount,
        currency,
        isAnonymousOnLeaderboard,
        message,
      }
    });

    // Create notification for tenant admins
    const adminMemberships = await prisma.userTenantMembership.findMany({
      where: {
        tenantId,
        status: 'APPROVED',
        roles: {
          some: {
            role: 'ADMIN'
          }
        }
      },
      select: {
        userId: true
      }
    });

    if (adminMemberships.length > 0) {
      // If donor is authenticated, use NotificationService to enqueue tenant-scoped notifications
      // This ensures actor validation and uses the outbox for downstream delivery.
      if (userId) {
        await Promise.all(
          adminMemberships.map((membership: any) =>
            NotificationService.enqueueNotification({
              tenantId,
              actorUserId: userId,
              to: membership.userId,
              type: 'NEW_DONATION',
              subject: `New donation received: ${currency} ${amount}`,
              html: `A new donation was received for ${tenantId}: ${currency} ${amount}`,
            })
          )
        );
      } else {
        // Fallback for anonymous donors: preserve existing behavior by creating notifications directly.
        // These notifications won't be validated via the outbox (no actor), matching prior behavior.
        await prisma.notification.createMany({
          data: adminMemberships.map((membership: any) => ({
            userId: membership.userId,
            actorUserId: null,
            type: 'NEW_ANNOUNCEMENT' as const,
            message: `New donation received: ${currency} ${amount}`,
            link: `/tenants/${tenantId}/donations`,
          }))
        });
      }
    }

    return NextResponse.json(donation, { status: 201 });
  } catch (error) {
    console.error(`Failed to create donation record for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/donations/records', tenantId });
  }
}
