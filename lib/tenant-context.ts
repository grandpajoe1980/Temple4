import { prisma } from './db';
import { Tenant, TenantSettings, TenantBranding, UserTenantMembership, MembershipStatus } from '@prisma/client';

/**
 * Enriched tenant context with user membership info
 */
export interface TenantContext {
  tenant: Tenant & {
    settings: TenantSettings | null;
    branding: TenantBranding | null;
  };
  membership: (UserTenantMembership & {
    roles: { role: string }[];
  }) | null;
  isPublic: boolean;
  hasAccess: boolean;
}

/**
 * Get tenant context with proper access validation
 * 
 * This is the centralized helper for loading tenant data with proper access checks.
 * Use this in all tenant-scoped routes and APIs.
 * 
 * @param tenantId - The tenant ID or slug
 * @param userId - Optional user ID for membership checks
 * @returns TenantContext or null if tenant doesn't exist or user doesn't have access
 */
export async function getTenantContext(
  tenantId: string,
  userId?: string
): Promise<TenantContext | null> {
  try {
    // Load tenant with settings and branding
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { id: tenantId },
          { slug: tenantId },
        ],
      },
      include: {
        settings: true,
        branding: true,
      },
    });

    // Tenant doesn't exist
    if (!tenant) {
      return null;
    }

    // Check if tenant is soft-deleted (if we add isDeleted field later)
    // For now, we don't have soft delete on Tenant model

    // Determine if tenant is public
    const isPublic = tenant.settings?.isPublic ?? false;

    // If no userId provided (anonymous user)
    if (!userId) {
      // Anonymous users can only access public tenants
      return isPublic ? {
        tenant,
        membership: null,
        isPublic: true,
        hasAccess: true,
      } : null;
    }

    // Load user membership
    const membership = await prisma.userTenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: tenant.id,
        },
      },
      include: {
        roles: {
          select: {
            role: true,
          },
        },
      },
    });

    // Check membership status
    if (membership) {
      // User is banned - deny access
      if (membership.status === MembershipStatus.BANNED) {
        return null;
      }

      // User is rejected - deny access
      if (membership.status === MembershipStatus.REJECTED) {
        return null;
      }

      // User is pending or approved - grant access
      // (Pending users might see limited content based on visitorVisibility)
      return {
        tenant,
        membership,
        isPublic,
        hasAccess: true,
      };
    }

    // User has no membership
    // Grant access to public tenants
    if (isPublic) {
      return {
        tenant,
        membership: null,
        isPublic: true,
        hasAccess: true,
      };
    }

    // User has no access to private tenant
    return null;
  } catch (error) {
    console.error('[getTenantContext] Error:', error);
    return null;
  }
}

/**
 * Check if user can view specific content type in tenant
 * Respects tenant settings and visitor visibility
 */
export function canViewContent(
  context: TenantContext,
  contentType: 'posts' | 'calendar' | 'sermons' | 'podcasts' | 'books' | 'prayerWall' | 'resources'
): boolean {
  const settings = context.tenant.settings;
  if (!settings) {
    return false;
  }

  // Check if feature is enabled
  const featureMap: Record<typeof contentType, keyof TenantSettings> = {
    posts: 'enablePosts',
    calendar: 'enableCalendar',
    sermons: 'enableSermons',
    podcasts: 'enablePodcasts',
    books: 'enableBooks',
    prayerWall: 'enablePrayerWall',
    resources: 'enableResourceCenter',
  };

  const featureKey = featureMap[contentType];
  if (typeof settings[featureKey] === 'boolean' && !settings[featureKey]) {
    return false;
  }

  // If user is an approved member, they can view enabled features
  if (context.membership && context.membership.status === MembershipStatus.APPROVED) {
    return true;
  }

  // For non-members or pending members, check visitor visibility
  if (settings.visitorVisibility && typeof settings.visitorVisibility === 'object') {
    const visibility = settings.visitorVisibility as Record<string, boolean>;
    return visibility[contentType] === true;
  }

  return false;
}
