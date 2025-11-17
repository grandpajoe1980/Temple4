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

### Phase 1: Document Current State (Immediate)
- [x] Create this ticket
- [ ] Audit all uses of `as any` in codebase
- [ ] List all client components with async data access
- [ ] Document all type conflicts between types.ts and Prisma

### Phase 2: Create API Endpoints (High Priority)
- [ ] Create `/api/users/[userId]` - GET user data
- [ ] Create `/api/users/[userId]/memberships` - GET user memberships
- [ ] Create `/api/tenants/[tenantId]/members` - GET tenant members
- [ ] Create `/api/conversations/[id]/messages` - GET messages
- [ ] Create `/api/admin/users` - GET all users (super admin)
- [ ] Create `/api/admin/audit-logs` - GET audit logs

### Phase 3: Update Components to Use APIs
- [ ] MyMembershipsTab - use fetch to API endpoint
- [ ] ConversationDetailsPanel - receive membership data as prop or fetch
- [ ] CreateChannelForm - use fetch to members endpoint
- [ ] MessageStream - use fetch to messages endpoint
- [ ] NewMessageModal - use fetch to users endpoint
- [ ] AdminConsole - use fetch to admin endpoints
- [ ] EventsList - use fetch to events endpoint

### Phase 4: Deprecate Custom Types
- [ ] Identify which custom types can be removed
- [ ] Update components to use Prisma types with includes
- [ ] Create proper DTO types where needed (e.g., for API responses)
- [ ] Remove unused custom types from types.ts

### Phase 5: Remove Type Casts
- [ ] Search for all `as any` casts
- [ ] Replace with proper types
- [ ] Ensure TypeScript strict mode compliance

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
