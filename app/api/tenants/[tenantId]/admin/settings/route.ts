import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { handleApiError, unauthorized, forbidden, validationError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { hasRole } from '@/lib/permissions';
import { z } from 'zod';
import { TenantRole } from '@/types';

// Helper to check if user is platform admin or tenant admin
async function canManageTenantSettings(userId: string, tenantId: string, isSuperAdmin?: boolean): Promise<boolean> {
    if (isSuperAdmin) return true;
    return hasRole(userId, tenantId, [TenantRole.ADMIN]);
}

// 17.1 Get Tenant Settings
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
        return unauthorized();
    }

    try {
        const canAccess = await canManageTenantSettings(user.id, tenantId, user.isSuperAdmin);
        if (!canAccess) {
            return forbidden('You do not have permission to view tenant settings.');
        }

        const settings = await prisma.tenantSettings.findUnique({
            where: { tenantId: tenantId },
        });

        return NextResponse.json(settings);
    } catch (error) {
        return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/admin/settings', tenantId, userId: user?.id });
    }
}

const settingsSchema = z.object({
    isPublic: z.boolean().optional(),
    membershipApprovalMode: z.enum(['AUTO', 'MANUAL', 'INVITE_ONLY']).optional(),
    // Feature toggles
    enableCalendar: z.boolean().optional(),
    enableEvents: z.boolean().optional(),
    enablePosts: z.boolean().optional(),
    enableSermons: z.boolean().optional(),
    enablePodcasts: z.boolean().optional(),
    enablePhotos: z.boolean().optional(),
    enableBooks: z.boolean().optional(),
    enableMemberDirectory: z.boolean().optional(),
    enableGroupChat: z.boolean().optional(),
    enableComments: z.boolean().optional(),
    enableReactions: z.boolean().optional(),
    enableServices: z.boolean().optional(),
    enableDonations: z.boolean().optional(),
    enableRecurringPledges: z.boolean().optional(),
    enableTranslation: z.boolean().optional(),
    enableMemorials: z.boolean().optional(),
    enableVanityDomains: z.boolean().optional(),
    enableAssetManagement: z.boolean().optional(),
    enableWorkboard: z.boolean().optional(),
    enableTicketing: z.boolean().optional(),
    enableMemberNotes: z.boolean().optional(),
    enableVolunteering: z.boolean().optional(),
    enableSmallGroups: z.boolean().optional(),
    enableTrips: z.boolean().optional(),
    enableLiveStream: z.boolean().optional(),
    enablePrayerWall: z.boolean().optional(),
    autoApprovePrayerWall: z.boolean().optional(),
    enableResourceCenter: z.boolean().optional(),
    enableTripFundraising: z.boolean().optional(),
    enableBirthdays: z.boolean().optional(),
    // Other settings
    tripCalendarColor: z.string().optional(),
    welcomePacketUrl: z.string().nullable().optional(),
    welcomePacketVersion: z.number().nullable().optional(),
    // Complex objects
    permissions: z.record(z.string(), z.record(z.string(), z.boolean())).optional(),
    donationSettings: z.any().optional(),
    liveStreamSettings: z.any().optional(),
    translationSettings: z.any().optional(),
    visitorVisibility: z.any().optional(),
    newMemberAlertChannels: z.any().optional(),
}).passthrough(); // Allow additional fields

// 17.2 Update Tenant Settings
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
        return unauthorized();
    }

    const body = await request.json();
    const result = settingsSchema.safeParse(body);
    if (!result.success) {
        return validationError(result.error.flatten().fieldErrors as Record<string, string[]>);
    }

    try {
        const canAccess = await canManageTenantSettings(user.id, tenantId, user.isSuperAdmin);
        if (!canAccess) {
            return forbidden('You do not have permission to update tenant settings.');
        }

        // If permissions present, persist to Tenant.permissions
        let updatedSettings = null;
        if (result.data.permissions !== undefined) {
            await prisma.tenant.update({
                where: { id: tenantId },
                data: { permissions: result.data.permissions },
            });
        }

        // Update tenant settings fields (if any)
        const settingsUpdateData: any = { ...result.data };
        delete settingsUpdateData.permissions;
        
        if (Object.keys(settingsUpdateData).length > 0) {
            updatedSettings = await prisma.tenantSettings.update({
                where: { tenantId: tenantId },
                data: settingsUpdateData,
            });
        }

        return NextResponse.json(updatedSettings ?? { success: true });
    } catch (error) {
        return handleApiError(error, { route: 'PUT /api/tenants/[tenantId]/admin/settings', tenantId, userId: user?.id });
    }
}
