// FIX: Changed 'import type' for TenantRole to a value import.
// FIX: Changed EnrichedConversation to Conversation to fix a type mismatch in seed-data.ts.
import { TenantRole, type User, type Tenant, type RolePermissions, type EnrichedChatMessage, type Conversation } from '../types';
import { TenantRoleType } from '../types';
import { getMembershipForUserInTenant } from '../seed-data';

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
export function can(user: User, tenant: Tenant, permission: keyof RolePermissions): boolean {
  // Super Admins can do anything.
  if (user.isSuperAdmin) {
    return true;
  }

  // Find the user's membership for this specific tenant.
  const membership = getMembershipForUserInTenant(user.id, tenant.id);

  // If the user is not a member or not approved, they have no permissions.
  if (!membership || membership.status !== 'APPROVED') {
    return false;
  }
  
  // Check if any of the user's roles grant the required permission.
  for (const roleInfo of membership.roles) {
    const roleType = getRoleType(roleInfo.role);

    if (roleType === 'ADMIN') {
        // Admins have all permissions defined under the ADMIN key.
        if (tenant.permissions.ADMIN[permission]) {
            return true;
        }
    } else {
        // For other roles, check against their TenantRoleType.
        const rolePerms = tenant.permissions[roleType];
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
export function hasRole(user: User, tenantId: string, role: TenantRole): boolean {
  // Super admin implicitly has ADMIN role for any tenant
  if (user.isSuperAdmin && role === TenantRole.ADMIN) {
    return true;
  }

  const membership = getMembershipForUserInTenant(user.id, tenantId);
  
  if (!membership || membership.status !== 'APPROVED') {
    return false;
  }

  return membership.roles.some(r => r.role === role);
}


/**
 * Checks if a user can delete a specific message.
 */
export function canDeleteMessage(
  user: User,
  message: EnrichedChatMessage,
  conversation: Conversation,
  tenant?: Tenant
): boolean {
  // Super Admins can do anything.
  if (user.isSuperAdmin) {
    return true;
  }
  
  // The user who sent the message can delete it.
  if (user.id === message.userId) {
    return true;
  }

  // If it's a tenant conversation, check for moderation permissions.
  if (tenant && conversation.tenantId === tenant.id) {
    if (can(user, tenant, 'canModerateChats')) {
      return true;
    }
  }

  // Otherwise, no permission.
  return false;
}