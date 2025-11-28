# Temple4 Improvement Plan (todo3.md)

This document outlines the next phase of improvements for the Temple4 codebase. The goal is to elevate the code quality to "best in class" standards, ensuring maintainability, type safety, and performance.

## 1. Architecture & Code Organization

### 1.1 Refactor `lib/data.ts` (The "God File")
**Problem:** `lib/data.ts` has grown too large (2000+ lines) and mixes concerns (Tenants, Users, Facilities, Notifications, etc.).
**Solution:** Split this file into domain-specific service modules under `lib/services/`.
- [ ] Create `lib/services/tenant-service.ts` (Move `getTenantsForUser`, `getTenantById`, etc.)
- [ ] Create `lib/services/user-service.ts` (Move `getUserById`, `getUserByEmail`, etc.)
- [ ] Create `lib/services/facility-service.ts` (Move all facility logic)
- [ ] Create `lib/services/notification-service.ts` (Move notification logic)
- [ ] Update imports across the application to point to the new services.

### 1.2 Standardize Client/Server Boundaries
**Problem:** Some Server Components (e.g., `app/page.tsx`) call `prisma` directly, while others might be using `lib/data.ts`.
**Solution:** Adopt a strict **Component -> Service -> Prisma** pattern for Server Components, and **Component -> API -> Service -> Prisma** for Client Components.
- [ ] Ensure `app/page.tsx` uses `tenant-service` instead of direct Prisma calls.
- [ ] Audit other `page.tsx` files to ensure they don't access `prisma` directly if a service exists.

## 2. Type Safety & TypeScript

### 2.1 Eliminate `as any` Casts
**Problem:** There are several `as any` casts masking type issues, particularly in `lib/data.ts` and API routes.
- [ ] `lib/data.ts`: Fix `(prisma as any)?.facility` checks. Ensure Prisma Client is properly generated and types are up to date.
- [ ] `app/api/tenants/route.ts`: Fix `(session.user as any).id`. Extend the `Session` type in `types/next-auth.d.ts` or similar to include `id`.
- [ ] Scan codebase for other `as any` usages and replace with proper types or type guards.

### 2.2 Strict Null Checks
- [ ] Ensure all service functions handle `null`/`undefined` inputs gracefully and return predictable types (e.g., `User | null` instead of `User | undefined`).

## 3. API & Error Handling

### 3.1 Consistent API Responses
**Problem:** While some routes use `lib/api-response.ts`, we need to ensure *all* routes follow this pattern.
- [ ] Audit all routes in `app/api/` to ensure they use `handleApiError`, `unauthorized`, `validationError`, etc.
- [ ] Ensure consistent HTTP status codes (401 for unauthenticated, 403 for unauthorized).

### 3.2 Input Validation
- [ ] Ensure all POST/PUT endpoints use `zod` for schema validation (like `app/api/tenants/route.ts` does).

## 4. Performance & Best Practices

### 4.1 Image Optimization
**Problem:** `app/components/HomePageClient.tsx` uses standard `<img>` tags.
**Solution:** Use Next.js `Image` component for automatic optimization.
- [ ] Replace `<img>` with `next/image` in `HomePageClient.tsx`.
- [ ] Scan for other `<img>` tags and replace where appropriate.

### 4.2 Large Component Refactoring
- [ ] Identify components larger than 300 lines and consider breaking them down into smaller sub-components.
- [ ] Check `app/components/tenant/TenantSelector.tsx` (if it exists and is large).

## 5. Testing

### 5.1 Fix Failing Tests
**Problem:** `todo2.md` reports 6 failing tests.
- [ ] Investigate and fix the 401/404 errors in the test suite.
- [ ] Ensure `test-suite/run-tests.ts` passes completely.

### 5.2 Increase Coverage
- [ ] Add unit tests for the new service modules (`lib/services/*`).

## 6. UX & Accessibility

### 6.1 Accessibility Audit
- [ ] Ensure all interactive elements (buttons, links, inputs) have `aria-label` or visible labels.
- [ ] Verify keyboard navigation (Tab order, Focus states) on key pages (Home, Login, Tenant Dashboard).

### 6.2 UI Polish
- [ ] Check for consistent use of Tailwind colors and spacing variables.
- [ ] Ensure loading states are present for all async actions.

## 7. Security

### 7.1 Tenant Isolation
- [ ] Verify that all tenant-scoped queries include `where: { tenantId }`.
- [ ] Use `lib/tenant-context.ts` helpers to enforce this automatically where possible.

---

**Priority Order:**
1. Refactor `lib/data.ts` (High impact on maintainability)
2. Fix Type Safety issues (High impact on stability)
3. Fix Failing Tests (High impact on correctness)
4. API Standardization
5. UI/Performance Improvements
