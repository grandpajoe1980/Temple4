# Ticket #0002: Align Type System - Prisma vs Custom Types

**Status:** OPEN

**Priority:** CRITICAL  
**Phase:** Phase A - Foundation & Data Model  
**Created:** 2025-11-17

## Context

The codebase has a systemic issue with two conflicting type systems:
1. **Custom types** in `types.ts` (legacy, incomplete)
2. **Prisma generated types** in `@prisma/client` (source of truth)

This causes:
- Extensive use of `as any` casts throughout the codebase
- Type mismatches between components and data layer
- Client components calling async server functions in sync contexts
- Incompatible type definitions (e.g., `string | undefined` vs `string | null`)

**Per Problem Statement:** "We should fix all of the types. We should not just employ workarounds and leave systemic problems in place."

## Root Causes

### 1. Type Definition Conflicts
- `UserProfile` in types.ts lacks `id`, `userId` fields
- `User.password` is `string | null | undefined` vs `string | null`
- `Tenant` has nested `address` object vs flat fields in Prisma
- `AuditLog.effectiveUserId` is `string | undefined` vs `string | null`

### 2. Async/Sync Boundary Violations
Multiple client components call async data layer functions synchronously:
- `MyMembershipsTab` - calls `getEnrichedMembershipsForUser` in `useMemo`
- `ConversationDetailsPanel` - calls `getMembershipForUserInTenant` in `useMemo`
- `CreateChannelForm` - calls `getMembersForTenant` in `useMemo`
- `MessageStream` - calls `getMessagesForConversation` in useState initializer
- `NewMessageModal` - calls `getAllUsers` in `useMemo`
- `EventsList` (likely) - async event fetch in component

### 3. Missing API Layer
Client components directly import and call functions from `lib/data.ts` which:
- Uses Prisma (server-only)
- Returns Promises
- Cannot work in client components

## Steps Required

### Phase 1: Document Current State
- [x] Create this ticket
- [x] Initial error analysis (Session 4)
- [x] Comprehensive error breakdown completed
- [ ] Audit all uses of `as any` in codebase (estimated: 10-15 instances)
- [x] List client components with async data access (see Session 4 Analysis below)
- [x] Document type conflicts between types.ts and Prisma (partially complete)

### Session 4 Analysis (2025-11-17)

**Current Build State:**
- Total TypeScript errors: 215
- Turbopack compilation: ✅ SUCCESS
- Promise/async errors: ~79 (37%)
- Type mismatch errors: ~46 (21%)
- Function signature errors: ~20 (9%)
- Other errors: ~70 (33%)

**Fixes Applied (Session 4):**
1. ✅ User.password type: `password?: string | null` → `password: string | null`
2. ✅ Fixed 5 type import paths: `'../../../types'` → `'@/types'`
3. ✅ MembershipStatus enum: REQUESTED → PENDING (4 files)
4. ✅ getTenantById: Added address transformation (nested structure)
5. ✅ getEventsForTenant: Added creator info mapping
6. ✅ PublicEventsView: Converted to async server component (WORKS!)

**Client Components with Architectural Issues:**
These components use React hooks and call async Prisma functions:

*Pages:*
- app/components/tenant/BooksPage.tsx (useState, calls getBooksForTenant)
- app/components/tenant/SermonsPage.tsx (calls getSermonsForTenant)
- app/components/tenant/PodcastsPage.tsx (calls getPodcastsForTenant)
- app/components/tenant/PostsPage.tsx (calls getPostsForTenant)
- app/components/tenant/EventsPage.tsx (calls getEventsForTenant)
- app/components/tenant/ChatPage.tsx (useState, calls multiple functions)
- app/components/tenant/ResourceCenterPage.tsx (calls getResourcesForTenant)
- app/components/tenant/VolunteeringPage.tsx (calls getVolunteerNeeds)
- app/components/tenant/SmallGroupsPage.tsx (calls getSmallGroups)
- app/components/tenant/DonationsPage.tsx (calls getDonationSettings)
- app/components/tenant/PrayerWallPage.tsx (calls getCommunityPosts)
- app/components/tenant/ContactPage.tsx (calls getContactSubmissions)

*Layout/Shared:*
- app/components/public/PublicHeader.tsx (useMemo, calls getMembershipForUserInTenant)
- app/components/tenant/TenantLayout.tsx (useState, calls getNotificationsForUser)

*Card Components:*
- app/components/tenant/SmallGroupCard.tsx (calls getMembershipForGroup)
- app/components/tenant/VolunteerNeedCard.tsx (calls getVolunteerSignup)
- app/components/tenant/ResourceItemCard.tsx (calls can() without await)

*Tab Components:*
- app/components/tenant/tabs/ContactSubmissionsTab.tsx (useMemo, useState)
- app/components/tenant/tabs/MembershipTab.tsx (calls can() without await)
- app/components/tenant/tabs/PrayerWallTab.tsx (calls getCommunityPosts)
- app/components/tenant/tabs/EditUserProfileModal.tsx (function signature mismatch)
- app/components/tenant/tabs/PermissionsTab.tsx (function signature mismatch)

**Function Signature Mismatches:**
Many data layer functions expect different arguments than components provide:
- addPost(tenantId, postData) vs called with just (postData)
- addEvent(tenantId, eventData) vs called with just (eventData)
- updateContactSubmissionStatus expects different args
- And ~15 more similar issues

### Phase 2: Create API Endpoints (High Priority)
- [ ] Create `/api/users/[userId]` - GET user data
- [ ] Create `/api/users/[userId]/memberships` - GET user memberships
- [ ] Create `/api/tenants/[tenantId]/members` - GET tenant members
- [ ] Create `/api/conversations/[id]/messages` - GET messages
- [ ] Create `/api/admin/users` - GET all users (super admin)
- [ ] Create `/api/admin/audit-logs` - GET audit logs

### Phase 3: Update Components to Use APIs
Based on Session 4 analysis, ~25 components need refactoring:
- [ ] BooksPage - convert to server component or use API
- [ ] SermonsPage - convert to server component or use API
- [ ] PodcastsPage - convert to server component or use API
- [ ] PostsPage - convert to server component or use API
- [ ] EventsPage - convert to server component or use API
- [ ] ChatPage - refactor to use API for data fetching
- [ ] ResourceCenterPage - convert to server component or use API
- [ ] VolunteeringPage - convert to server component or use API
- [ ] SmallGroupsPage - convert to server component or use API
- [ ] DonationsPage - convert to server component or use API
- [ ] PrayerWallPage - convert to server component or use API
- [ ] ContactPage - convert to server component or use API
- [ ] PublicHeader - refactor async data access
- [ ] TenantLayout - refactor async data access
- [ ] MyMembershipsTab - use fetch to API endpoint
- [ ] ConversationDetailsPanel - receive membership data as prop or fetch
- [ ] CreateChannelForm - use fetch to members endpoint
- [ ] MessageStream - use fetch to messages endpoint
- [ ] NewMessageModal - use fetch to users endpoint
- [ ] AdminConsole - use fetch to admin endpoints
- [ ] SmallGroupCard - refactor async checks
- [ ] VolunteerNeedCard - refactor async checks
- [ ] ResourceItemCard - refactor permission checks
- [ ] ContactSubmissionsTab - refactor data fetching
- [ ] MembershipTab - refactor permission checks

### Phase 4: Deprecate Custom Types
- [ ] Identify which custom types can be removed
- [ ] Update components to use Prisma types with includes
- [ ] Create proper DTO types where needed (e.g., for API responses)
- [ ] Remove unused custom types from types.ts

### Phase 5: Remove Type Casts
- [ ] Search for all `as any` casts
- [ ] Replace with proper types
- [ ] Ensure TypeScript strict mode compliance

## Effort Estimate

Based on Session 4 analysis:

**Phase 1 (Documentation):** ✅ COMPLETE (Session 4)
**Phase 2 (API Endpoints):** 1-2 days
- ~10-15 new API routes needed
- Each route: 30-60 minutes (includes auth, validation, tests)

**Phase 3 (Component Refactoring):** 2-3 days
- ~25 components need updates
- Each component: 1-2 hours (split server/client, update data flow)
- Complexity varies: simple pages (30 min) vs interactive pages (2 hours)

**Phase 4 (Type System):** 1 day
- Audit custom types vs Prisma types
- Create proper DTOs where needed
- Remove obsolete custom types

**Phase 5 (Type Casts):** 0.5 days
- Search and replace ~10-15 `as any` casts
- Verify TypeScript strict mode compliance

**Total Estimate:** 4.5-6.5 days of focused work

**Alternative Incremental Approach:** 
- Fix server components first (0.5 day) - ✅ Started in Session 4
- Create most critical APIs (1 day)
- Refactor highest-traffic components (1 day)
- Continue iteratively
- **Advantage:** Provides value earlier, allows learning/adjustment


## Acceptance Criteria

- [ ] Build completes with zero TypeScript errors
- [ ] Zero `as any` casts in the codebase (except where absolutely necessary with explanation)
- [ ] Client components do not import from `lib/data.ts`
- [ ] All data fetching uses API endpoints or server components
- [ ] Prisma types are used as source of truth
- [ ] Custom types are only used for:
  - UI-specific state
  - Form data
  - API request/response DTOs

## Affected Files (Known)

**Client Components with Async Issues:**
- app/components/account/MyMembershipsTab.tsx
- app/components/account/AccountSettingsPage.tsx
- app/components/admin/AdminConsole.tsx
- app/components/messages/ConversationDetailsPanel.tsx
- app/components/messages/CreateChannelForm.tsx
- app/components/messages/MessageStream.tsx
- app/components/messages/NewMessageModal.tsx
- app/components/events/EventsList.tsx (likely)

**Type Definition Files:**
- types.ts - custom types
- @prisma/client - generated types

**Data Layer:**
- lib/data.ts - async functions that should only be called from server

## Links

- Related: todo.md Section 2.1 - Align conceptual models with Prisma schema
- Related: Ticket #0001 - Async params migration (completed)
- Decision: docs/journal.md Session 3 - Decision 3

## Notes

- This is the #1 blocker for build success
- Estimate: 2-3 days of focused work
- Will require touching 30-50 files
- Should be prioritized before any new feature work
- Consider creating sub-tickets for each phase if too large

## Workarounds Currently in Place

Minimal `as any` casts added to unblock build in these files:
- AccountSettingsPage.tsx
- MyMembershipsTab.tsx
- AdminConsole.tsx
- MessageStream.tsx

**These are temporary and must be removed as part of this ticket's resolution.**
