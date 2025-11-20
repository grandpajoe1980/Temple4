/**
 * Tenant Isolation Audit Utility
 * 
 * Helps ensure tenant data isolation by providing helpers for tenant-scoped queries.
 * Addresses todo.md Section 9.2: Tenant isolation & data leakage
 */

import { Prisma } from '@prisma/client';

/**
 * Ensures a where clause includes tenantId filter
 * Throws an error if attempting a query without tenant scope on tenant-scoped models
 * 
 * @param where - Prisma where clause
 * @param tenantId - Required tenant ID
 * @param modelName - Name of the model for error messages
 * @returns Where clause with guaranteed tenantId filter
 */
export function withTenantScope<T extends Record<string, any>>(
  where: T | undefined,
  tenantId: string,
  modelName: string
): T & { tenantId: string } {
  if (!tenantId) {
    throw new Error(`Tenant ID is required for ${modelName} queries`);
  }

  // If where is undefined, create new object with tenantId
  if (!where) {
    return { tenantId } as T & { tenantId: string };
  }

  // If where exists, ensure it includes tenantId
  // Warn if tenantId was already present but different (potential bug)
  if ('tenantId' in where && where.tenantId && where.tenantId !== tenantId) {
    console.warn(
      `[SECURITY] Tenant ID mismatch in ${modelName} query. ` +
      `Expected: ${tenantId}, Found: ${where.tenantId}`
    );
  }

  return { ...where, tenantId };
}

/**
 * List of models that should always be scoped by tenantId
 */
export const TENANT_SCOPED_MODELS: ReadonlyArray<Prisma.ModelName> = [
  'Tenant',
  'TenantSettings',
  'TenantBranding',
  'UserTenantMembership',
  'UserTenantRole',
  'Post',
  'Event',
  'EventRSVP',
  'MediaItem',
  'Book',
  'Podcast',
  'Conversation',
  'DonationSettings',
  'DonationRecord',
  'VolunteerNeed',
  'VolunteerSignup',
  'SmallGroup',
  'SmallGroupMembership',
  'CommunityPost',
  'ResourceItem',
  'ContactSubmission',
  'AuditLog', // Includes tenantId when action is tenant-specific
];

/**
 * Validates that a model name is tenant-scoped
 */
export function isTenantScopedModel(modelName: Prisma.ModelName): boolean {
  return TENANT_SCOPED_MODELS.includes(modelName);
}

/**
 * Audit helper to check if a query includes tenant isolation
 * Use in development to catch potential data leakage
 * 
 * @param modelName - Name of the Prisma model
 * @param where - The where clause being used
 * @param context - Additional context for logging
 */
export function auditTenantIsolation(
  modelName: string,
  where: any,
  context?: { route?: string; userId?: string }
) {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Skip if model doesn't need tenant scoping
  if (!isTenantScopedModel(modelName)) {
    return;
  }

  // Check if tenantId is in the where clause
  if (!where || !where.tenantId) {
    const contextStr = context 
      ? ` [${Object.entries(context).map(([k, v]) => `${k}:${v}`).join(', ')}]`
      : '';
    
    console.warn(
      `[TENANT ISOLATION WARNING]${contextStr} ` +
      `Query on ${modelName} without tenantId filter. This could leak cross-tenant data.`,
      { where }
    );
  }
}

/**
 * Type guard to ensure tenant membership before operations
 * 
 * @param membership - User's membership record
 * @param requiredStatus - Required membership status (defaults to APPROVED)
 * @returns True if user has valid membership
 */
export function hasValidMembership(
  membership: { status: string } | null | undefined,
  requiredStatus: string = 'APPROVED'
): membership is { status: string } {
  return membership?.status === requiredStatus;
}

/**
 * Validates user has access to tenant
 * Throws error if not, suitable for API route guards
 * 
 * @param membership - User's membership or null
 * @param tenantId - Tenant being accessed
 * @param userId - User attempting access
 */
export function requireTenantAccess(
  membership: { status: string } | null,
  tenantId: string,
  userId?: string
): asserts membership is { status: string } {
  if (!membership || membership.status !== 'APPROVED') {
    const userContext = userId ? ` (user: ${userId})` : '';
    throw new Error(
      `Access denied: User does not have valid membership in tenant ${tenantId}${userContext}`
    );
  }
}
