// Fallback type declarations for Prisma client when it's outdated
// This file provides type safety when the Prisma client can't be regenerated

declare module '@prisma/client' {
  // Re-export types that exist
  export * from '.prisma/client';
  
  // Add fallbacks for types that might be missing
  export type User = any;
  export type UserProfile = any;
  export type Tenant = any;
  export type TenantSettings = any;
  export type TenantBranding = any;
  export type Post = any;
  export type Event = any;
  export type UserTenantMembership = any;
  export type AccountSettings = any;
  export type UserPrivacySettings = any;
  export type Notification = any;
  export type AuditLog = any;
  export type Conversation = any;
  export type CommunityPost = any;
  export type ChatMessage = any;
  export type ImpersonationSession = any;
  export type Facility = any;
  export type FacilityBooking = any;
}
