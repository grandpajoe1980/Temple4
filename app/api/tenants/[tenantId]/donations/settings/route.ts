import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hasRole } from '@/lib/permissions';
import { z } from 'zod';
import { DonationSettings, MembershipStatus, TenantRole } from '@/types';
import { getTenantContext } from '@/lib/tenant-context';
import { handleApiError, unauthorized, forbidden, notFound, validationError } from '@/lib/api-response';

const donationSettingsSchema = z.object({
  mode: z.enum(['EXTERNAL', 'INTEGRATED']),
  externalUrl: z.string().url().optional(),
  integratedProvider: z.enum(['STRIPE', 'PAYPAL']).optional(),
  currency: z.string().min(3).max(3), // e.g., USD, EUR
  suggestedAmounts: z.array(z.number().positive()),
  allowCustomAmounts: z.boolean(),
  leaderboardEnabled: z.boolean(),
  leaderboardVisibility: z.enum(['PUBLIC', 'MEMBERS_ONLY']),
  leaderboardTimeframe: z.enum(['ALL_TIME', 'YEARLY', 'MONTHLY']),
  paypalUrl: z.string().url().optional(),
  venmoHandle: z.string().optional(),
  zelleEmail: z.string().email().optional(),
  cashAppTag: z.string().optional(),
  mailingAddress: z.string().optional(),
  taxId: z.string().optional(),
  bankTransferInstructions: z.string().optional(),
  textToGiveNumber: z.string().optional(),
  otherGivingNotes: z.string().optional(),
  otherGivingLinks: z
    .array(z.object({ label: z.string(), url: z.string().url() }))
    .optional(),
});

// GET /api/tenants/[tenantId]/donations/settings - Get donation settings
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);

  try {
    const context = await getTenantContext(tenantId, (session?.user as any)?.id);

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
      return forbidden('You must be an approved member to view donation settings');
    }

    return NextResponse.json(donationSettings);
  } catch (error) {
    console.error(`Failed to fetch donation settings for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/donations/settings', tenantId });
  }
}

// PATCH /api/tenants/[tenantId]/donations/settings - Update donation settings (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return unauthorized();
  }

  const userId = (session.user as { id: string }).id;

  try {
    // Check if user is an admin of this tenant
    const isAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);

    if (!isAdmin) {
      return forbidden('You must be an admin to update donation settings');
    }

    // Validate input
    const body = await request.json();
    const result = donationSettingsSchema.safeParse(body);

    if (!result.success) {
      return validationError(result.error.flatten().fieldErrors);
    }

    const newSettings = result.data;

    // Update donation settings in TenantSettings
    const updatedTenantSettings = await prisma.tenantSettings.update({
      where: { tenantId },
      data: {
        donationSettings: newSettings as any, // Cast to any for JSON field
      },
      select: {
        donationSettings: true,
      }
    });

    // Log the settings change
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        actionType: 'TENANT_PERMISSIONS_UPDATED',
        entityType: 'TenantSettings',
        entityId: tenantId,
        metadata: {
          action: 'UPDATE_DONATION_SETTINGS',
          changes: newSettings,
        }
      }
    });

    return NextResponse.json(updatedTenantSettings.donationSettings);
  } catch (error) {
    console.error(`Failed to update donation settings for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'PATCH /api/tenants/[tenantId]/donations/settings', tenantId });
  }
}
