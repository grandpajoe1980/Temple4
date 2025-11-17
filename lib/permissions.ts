import { TenantRole, User, Tenant, ChatMessage, Conversation, UserTenantMembership } from '@prisma/client';
import { prisma } from './db';

// Define RolePermissions based on your application's logic, as it's not in Prisma schema
export interface RolePermissions {
  canCreatePosts: boolean;
  canCreateEvents: boolean;
  canCreateSermons: boolean;
  canCreatePodcasts: boolean;
  canCreateBooks: boolean;
  canCreateGroupChats: boolean;
  canInviteMembers: boolean;
  canApproveMembership: boolean;
  canBanMembers: boolean;
  canModeratePosts: boolean;
  canModerateChats: boolean;
  canPostInAnnouncementChannels?: boolean;
  canManagePrayerWall: boolean;
  canUploadResources: boolean;
  canManageResources: boolean;
  canManageContactSubmissions: boolean;
}

// This can be a simple enum if you don't need the string values
export enum TenantRoleType {
    MEMBER = 'MEMBER',
    STAFF = 'STAFF',
    MODERATOR = 'MODERATOR',
}

async function getMembershipForUserInTenant(userId: string, tenantId: string): Promise<(UserTenantMembership & { roles: { role: TenantRole }[] }) | null> {
    return prisma.userTenantMembership.findUnique({
        where: {
            userId_tenantId: {
                userId,
                tenantId,
            },
        },
        include: {
            roles: {
                select: {
                    role: true
                }
            },
        }
    });
}



/**
 * Maps a specific TenantRole to a more general TenantRoleType for permission lookups.
 */
function getRoleType(role: TenantRole): TenantRoleType | 'ADMIN' {
    switch (role) {
        case TenantRole.ADMIN:
            return 'ADMIN';
        case TenantRole.STAFF:
        case TenantRole.CLERGY:
            return TenantRoleType.STAFF;
        case TenantRole.MODERATOR:
            return TenantRoleType.MODERATOR;
        case TenantRole.MEMBER:
            return TenantRoleType.MEMBER;
        default:
            return TenantRoleType.MEMBER;
    }
}


/**
 * Checks if a user has a specific permission within a tenant.
 * This is the centralized source of truth for all permission checks.
 *
 * @param user The user to check.
 * @param tenant The tenant context for the permission.
 * @param permission The permission to check for (e.g., 'canCreatePosts').
 * @returns {boolean} True if the user has the permission, false otherwise.
 */
export async function can(user: User, tenant: Tenant, permission: keyof RolePermissions): Promise<boolean> {
  // Super Admins can do anything.
  if (user.isSuperAdmin) {
    return true;
  }

  // Find the user's membership for this specific tenant.
  const membership = await getMembershipForUserInTenant(user.id, tenant.id);

  // If the user is not a member or not approved, they have no permissions.
  if (!membership || membership.status !== 'APPROVED') {
    return false;
  }
  
  // Check if any of the user's roles grant the required permission.
  for (const roleInfo of membership.roles) {
    const roleType = getRoleType(roleInfo.role);
    const permissions = tenant.permissions as any;

    // If permissions is null or undefined, no permissions are granted
    if (!permissions) {
      continue;
    }

    if (roleType === 'ADMIN') {
        // Admins have all permissions defined under the ADMIN key.
        if (permissions.ADMIN && permissions.ADMIN[permission]) {
            return true;
        }
    } else {
        // For other roles, check against their TenantRoleType.
        const rolePerms = permissions[roleType];
        if (rolePerms && rolePerms[permission]) {
            return true; // Permission granted by at least one role.
        }
    }
  }

  return false; // No role granted the permission.
}

/**
 * Checks if a user has a specific role within a tenant.
 *
 * @param user The user to check.
 * @param tenantId The ID of the tenant context for the role.
 * @param role The role to check for.
 * @returns {boolean} True if the user has the role, false otherwise.
 */
export async function hasRole(userId: string, tenantId: string, requiredRoles: TenantRole[]): Promise<boolean> {
  const membership = await getMembershipForUserInTenant(userId, tenantId);

  if (!membership || membership.status !== 'APPROVED') {
    return false;
  }

  return membership.roles.some(roleInfo => requiredRoles.includes(roleInfo.role));
}

/**
 * Checks if a user can view a certain type of content (e.g., posts, events).
 * It checks tenant settings for public visibility and feature enablement.
 *
 * @param userId The ID of the user attempting to view. Can be null for anonymous users.
 * @param tenantId The ID of the tenant where the content resides.
 * @param contentType The key for the content type in tenant settings (e.g., 'posts', 'calendar').
 * @returns {Promise<boolean>} True if the user can view the content.
 */
export async function canUserViewContent(userId: string | null, tenantId: string, contentType: 'posts' | 'calendar' | 'sermons' | 'podcasts' | 'books' | 'prayerWall'): Promise<boolean> {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { settings: true }
        });

        if (!tenant || !tenant.settings) {
            return false;
        }

        const settings = tenant.settings as any;

        // Check if the entire feature is disabled
        const featureFlag = `enable${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`;
        if (!settings[featureFlag]) {
            return false;
        }

        const membership = userId ? await getMembershipForUserInTenant(userId, tenantId) : null;

        // If user is not a member, check public visibility settings
        if (!membership || membership.status !== 'APPROVED') {
            // Check if visitorVisibility exists and has the content type property
            if (!settings.visitorVisibility || typeof settings.visitorVisibility !== 'object') {
                return false;
            }
            const result = settings.visitorVisibility[contentType] === true;
            return result;
        }

        // If they are an approved member, they can view it as long as the feature is enabled.
        return true;
    } catch (error) {
        console.error('[canUserViewContent] Error:', error);
        throw error;
    }
}

/**
 * Checks if a user has permission to create a post in a tenant.
 *
 * @param userId The ID of the user.
 * @param tenantId The ID of the tenant.
 * @param isAnnouncement Whether the post is an announcement.
 * @returns {Promise<boolean>} True if the user can create the post.
 */
export async function canUserPost(userId: string, tenantId: string, isAnnouncement: boolean): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!user || !tenant) return false;

    if (isAnnouncement) {
        return can(user, tenant, 'canPostInAnnouncementChannels');
    }
    return can(user, tenant, 'canCreatePosts');
}


/**
 * Checks if a user can delete a specific message.
 */
export async function canDeleteMessage(
  user: User,
  message: ChatMessage,
  conversation: Conversation,
  tenant: Tenant
): Promise<boolean> {
  if (user.isSuperAdmin) {
    return true;
  }
  // User can delete their own message
  if (message.userId === user.id) {
    return true;
  }
  // Check for moderation permissions
  if (!conversation.isDirectMessage) { // isGroupChat
    if (await can(user, tenant, 'canModerateChats')) {
      return true;
    }
  }
  return false;
}