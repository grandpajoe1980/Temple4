# Ticket #0003: Phase B - Auth, Sessions & Permissions Implementation

**Status:** OPEN

**Priority:** HIGH  
**Phase:** Phase B - Auth, Sessions, Permissions  
**Created:** 2025-11-18

## Context

Phase A (Foundation & Data Model) is complete with build passing and tests at baseline. 
We're now moving to Phase B which focuses on:
1. Auth, Sessions & NextAuth (Section 3 of todo.md)
2. Permissions & Tenant Isolation (Section 4 of todo.md)

## Current State Assessment

### ✅ Already Implemented (Section 3.1-3.3)
- NextAuth configuration with Credentials provider
- Basic registration flow (`/api/auth/register`)
- Login/logout via NextAuth
- Session management with JWT
- `/api/auth/me` endpoint
- Permission checking in `lib/permissions.ts`
  - `can(user, tenant, permission)` function
  - `hasRole(userId, tenantId, roles)` function
  - `canUserViewContent()` function
  - `canDeleteMessage()` function

### ❌ Needs Implementation

#### 3.2 Registration Enhancement
- [ ] Add Zod validation for registration inputs
- [ ] Add password strength validation
- [ ] Improve error messages for validation failures
- [ ] Verify audit logging works correctly

#### 3.4 Password Reset with Tokens (CRITICAL)
- [ ] Add `PasswordResetToken` model to schema.prisma
  - id (String, CUID, primary key)
  - token (String, unique)
  - userId (String, foreign key to User)
  - expiresAt (DateTime)
  - used (Boolean, default false)
  - createdAt (DateTime)
- [ ] Update `/api/auth/forgot-password`:
  - Generate cryptographically secure random token
  - Store token with 1-hour expiration
  - Log to console (email integration later)
- [ ] Update `/api/auth/reset-password`:
  - Accept token and new password
  - Validate token exists, not expired, not used
  - Update password with bcrypt
  - Mark token as used
  - Add proper error handling
- [ ] Add audit logging for password reset events
- [ ] Run database migration

#### 3.5 Impersonation Model (HIGH VALUE)
- [ ] Add `ImpersonationSession` model to schema.prisma
  - id (String, CUID, primary key)
  - realUserId (String, foreign key - the admin)
  - effectiveUserId (String, foreign key - impersonated user)
  - startedAt (DateTime)
  - endedAt (DateTime, nullable)
  - tenantId (String, nullable - context)
  - reason (String, optional)
- [ ] Create `lib/session.ts`:
  - `getEffectiveUser(session)` - returns actual or impersonated user
  - `startImpersonation(adminId, targetUserId, reason?)` 
  - `endImpersonation(sessionId)`
  - `getActiveImpersonation(adminId)`
- [ ] Create API endpoints:
  - `POST /api/admin/impersonate/start`
  - `POST /api/admin/impersonate/end`
  - `GET /api/admin/impersonate/status`
- [ ] Update NextAuth callbacks to include impersonation in JWT
- [ ] Add UI components:
  - ImpersonationBanner component
  - Exit impersonation button
- [ ] Add comprehensive audit logging
- [ ] Add permission check (super admin only)
- [ ] Run database migration

#### 4.2 Tenant Context Helper (FOUNDATIONAL)
- [ ] Create `lib/tenant-context.ts`:
  - `getTenantContext(tenantId, userId?)` function
  - Load tenant with settings, branding, permissions
  - Validate not soft-deleted
  - Check user access (membership or public)
  - Return enriched object with user's membership info
  - Return null for invalid/unauthorized
- [ ] Add validation:
  - Tenant existence check
  - User membership status check
  - Public vs private content handling
  - Banned/rejected user blocking
- [ ] Update 5+ tenant-scoped route handlers to use this
- [ ] Add unit tests for tenant-context

#### 4.3 UI Permission Enforcement
- [ ] Audit TenantLayout navigation:
  - Only show enabled features (TenantSettings flags)
  - Only show admin features to admins
  - Hide disabled features cleanly
- [ ] Create permission hooks:
  - `useCanAccess(permission)` for client components
  - `useHasRole(role)` for client components
  - `useTenantFeatures()` to get enabled features
- [ ] Create "Access Denied" page component:
  - Friendly message
  - Link back to tenant home
  - Use in protected routes
- [ ] Update all tenant pages to check permissions:
  - Settings (admin only)
  - Donations (when enabled)
  - Volunteering (when enabled)
  - Small Groups (when enabled)
  - Live Stream (when enabled)
  - Prayer Wall (when enabled)
  - Resources (based on visibility)
  - Contact submissions (admin only)

## Implementation Plan

### Sprint 1: Auth Enhancement (Days 1-2)
1. Add Zod validation to registration
2. Implement password reset with tokens (schema + API)
3. Test password reset flow
4. Update documentation

### Sprint 2: Impersonation (Days 3-4)
1. Add ImpersonationSession model
2. Implement session helpers
3. Create API endpoints
4. Add UI components
5. Test impersonation flow
6. Ensure audit logging works

### Sprint 3: Tenant Context & Permissions (Days 5-7)
1. Implement getTenantContext helper
2. Update route handlers to use it
3. Create permission hooks for client components
4. Create Access Denied page
5. Audit and update TenantLayout
6. Update all tenant pages with permission checks
7. Test permission enforcement

## Effort Estimate

- **Sprint 1:** 1.5-2 days
- **Sprint 2:** 1.5-2 days
- **Sprint 3:** 2-3 days
- **Total:** 5-7 days

## Acceptance Criteria

### Auth Enhancement
- [ ] Registration validates inputs with Zod
- [ ] Password reset generates and validates tokens
- [ ] Expired/used tokens are rejected
- [ ] Audit logs record auth events

### Impersonation
- [ ] ImpersonationSession model exists
- [ ] Super admin can start/end impersonation
- [ ] UI shows impersonation banner when active
- [ ] All requests use effective user
- [ ] Audit trail complete
- [ ] Non-admins cannot impersonate

### Tenant Context
- [ ] getTenantContext helper implemented and working
- [ ] Used in 5+ route handlers
- [ ] Handles all edge cases (deleted tenant, banned user, etc.)
- [ ] Returns appropriate errors/nulls

### UI Permissions
- [ ] TenantLayout respects feature flags
- [ ] Admin-only features hidden from non-admins
- [ ] Access Denied page works
- [ ] Permission hooks work in client components
- [ ] No crashes on unauthorized access

### Build & Tests
- [ ] Build passes with 0 TypeScript errors
- [ ] Test suite maintains or improves baseline (54/61+)
- [ ] New functionality has basic test coverage

## Dependencies

- Phase A must be complete ✅
- Database migrations must be run successfully
- No blocking issues in Ticket #0002 (type system deferred)

## Links

- Related: todo.md Section 3 (Auth, Sessions & NextAuth)
- Related: todo.md Section 4 (Permissions & Tenant Isolation)
- Related: Ticket #0002 (Type System - deferred)
- Parent Phase: Phase B – Auth, Sessions, Permissions

## Notes

- This ticket represents ALL of Phase B work
- Can be broken into sub-tickets if needed
- Focus on clean, tested, minimal changes
- Follow existing patterns in codebase
- Maintain backward compatibility
