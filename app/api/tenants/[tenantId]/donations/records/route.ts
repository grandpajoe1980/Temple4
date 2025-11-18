import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent } from '@/lib/permissions';
import { z } from 'zod';
import { DonationSettings } from '@/types';

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
    // Check if donations are enabled
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: {
        enableDonations: true,
        donationSettings: true,
      }
    });

    if (!tenantSettings || !tenantSettings.enableDonations) {
      return NextResponse.json(
        { message: 'Donations are not enabled for this tenant' },
        { status: 403 }
      );
    }

    const donationSettings = tenantSettings.donationSettings as any as DonationSettings;

    // Check leaderboard visibility
    if (donationSettings.leaderboardVisibility === 'MEMBERS_ONLY') {
      const canView = await canUserViewContent(userId, tenantId, 'posts');
      if (!canView) {
        return NextResponse.json(
          { message: 'You must be a member to view the donation leaderboard' },
          { status: 403 }
        );
      }
    }

    if (!donationSettings.leaderboardEnabled) {
      return NextResponse.json(
        { message: 'Leaderboard is not enabled' },
        { status: 403 }
      );
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
    const leaderboard = donations.map(donation => ({
      ...donation,
      displayName: donation.isAnonymousOnLeaderboard ? 'Anonymous' : donation.displayName
    }));

    return NextResponse.json({
      leaderboard,
      timeframe: donationSettings.leaderboardTimeframe,
    });
  } catch (error) {
    console.error(`Failed to fetch donation records for tenant ${tenantId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch donation records' }, { status: 500 });
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
    // Check if donations are enabled
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: {
        enableDonations: true,
        donationSettings: true,
      }
    });

    if (!tenantSettings || !tenantSettings.enableDonations) {
      return NextResponse.json(
        { message: 'Donations are not enabled for this tenant' },
        { status: 403 }
      );
    }

    const donationSettings = tenantSettings.donationSettings as any as DonationSettings;

    // Validate input
    const body = await request.json();
    const result = donationRecordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { amount, currency, displayName, isAnonymousOnLeaderboard, message } = result.data;

    // Validate currency matches settings
    if (currency !== donationSettings.currency) {
      return NextResponse.json(
        { message: `Currency must be ${donationSettings.currency}` },
        { status: 400 }
      );
    }

    // Validate amount is allowed
    if (!donationSettings.allowCustomAmounts && !donationSettings.suggestedAmounts.includes(amount)) {
      return NextResponse.json(
        { message: 'Amount must be one of the suggested amounts' },
        { status: 400 }
      );
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
      await prisma.notification.createMany({
        data: adminMemberships.map(membership => ({
          userId: membership.userId,
          actorUserId: userId,
          type: 'NEW_ANNOUNCEMENT' as const, // Using announcement type for donations
          message: `New donation received: ${currency} ${amount}`,
          link: `/tenants/${tenantId}/donations`,
        }))
      });
    }

    return NextResponse.json(donation, { status: 201 });
  } catch (error) {
    console.error(`Failed to create donation record for tenant ${tenantId}:`, error);
    return NextResponse.json({ message: 'Failed to record donation' }, { status: 500 });
  }
}
