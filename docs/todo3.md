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

## 8. Missing Features (from arch.md)

### 8.1 Notification Outbox Pattern
**Problem:** Notifications are currently synchronous or ad-hoc. `arch.md` specifies an Outbox pattern for reliability.
**Solution:** Implement `Outbox` table and worker.
- [ ] Create `Outbox` model in Prisma schema.
- [ ] Implement `lib/outbox.ts` to write events.
- [ ] Create a background worker (or Next.js API route cron) to process outbox events and send emails/notifications.

### 8.2 Row-Level Security (RLS) Pilot
**Problem:** Tenant isolation is currently enforced by application logic. `arch.md` suggests RLS for defense-in-depth.
**Solution:** Pilot RLS on a few tables.
- [ ] Research and document RLS strategy for Prisma + Postgres.
- [ ] Implement RLS policies for `Post` or `Event` tables in a migration.
- [ ] Verify RLS works with a test user.

### 8.3 Visitor Follow-up Flow
**Problem:** `arch.md` mentions a visitor follow-up pipeline which is missing.
- [ ] Create `Visitor` model (or use `ContactSubmission`).
- [ ] Implement a "Follow-up Task" system for admins.
- [ ] Create UI for tracking visitor status (New -> Contacted -> Resolved).

### 8.4 Event Check-in System
**Problem:** No way to check people in to events.
- [ ] Create `EventCheckIn` model.
- [ ] Build a "Greeter Mode" UI for checking in attendees by name or QR code.

### 8.5 Multi-language Support (i18n)
**Problem:** App is English-only.
- [ ] Set up `next-intl` or similar library.
- [ ] Extract hardcoded strings from `app/components` into message files.
- [ ] Add locale selector to the UI.

### 8.6 Admin Analytics Dashboard
**Problem:** No high-level view of tenant stats.
- [ ] Create `app/admin/dashboard` page.
- [ ] Implement aggregated queries for active members, events, and donations.

### 8.7 Operational Runbooks
**Problem:** Missing documentation for operations.
- [ ] Create `docs/ops-runbook.md` for incident response.
- [ ] Create `docs/onboarding.md` for 60-minute developer setup.

---

**Priority Order:**
1. Refactor `lib/data.ts` (High impact on maintainability)
2. Fix Type Safety issues (High impact on stability)
3. Fix Failing Tests (High impact on correctness)
4. Notification Outbox Pattern (High impact on reliability)
5. API Standardization
6. UI/Performance Improvements
7. Missing Features (Visitor, Check-in, Analytics)

## 9. Event System Implementation (See `docs/specs/event-system-spec.md`)

### 9.1 Phase 1: Core Event Management (MVP)
**Goal:** Admins can create/manage events, and members can view them on a calendar.
- [ ] **Schema**: Update `schema.prisma` with `Event` model (title, dates, visibility, location, poster).
- [ ] **Service**: Create `lib/services/event-service.ts` (migrate existing logic, add new CRUD).
- [ ] **API**: Create `app/api/tenants/[tenantId]/events` endpoints (GET, POST).
- [ ] **UI**: Build `EventForm` component (React Hook Form + Zod) with "Quick Add" and "Full Editor" modes.
- [ ] **UI**: Update `Calendar` component to fetch from new API and support "Public" vs "Members Only" filters.
- [ ] **UI**: Create `EventDetailPage` with hero image and details.

### 9.2 Phase 2: RSVP & Engagement
**Goal:** Users can register for events.
- [ ] **Schema**: Add `EventRSVP` model.
- [ ] **Service**: Add `rsvpToEvent`, `cancelRsvp`, `getEventAttendees` to `event-service.ts`.
- [ ] **API**: Add RSVP endpoints.
- [ ] **UI**: Add "Register / RSVP" button and modal to Event Detail page.
- [ ] **UI**: Add "My Events" view for users.
- [ ] **Email**: Send confirmation emails on RSVP.

### 9.3 Phase 3: Advanced Features
**Goal:** Full event operations (Waitlist, Volunteers, Check-in).
- [ ] **Schema**: Add `waitlistEnabled`, `capacityLimit` to Event; add `EventVolunteerRole`.
- [ ] **Logic**: Implement waitlist promotion logic (auto-promote or manual).
- [ ] **UI**: Add Volunteer signup flow within RSVP modal.
- [ ] **UI**: Build "Greeter Mode" for checking in attendees.
- [ ] **Export**: Add CSV export for attendee lists.

---

**Priority Order:**
1. Refactor `lib/data.ts` (Critical dependency for Event System)
2. Fix Type Safety issues (High impact on stability)
3. Event System Phase 1 (Core Features)
4. Fix Failing Tests (High impact on correctness)
5. Event System Phase 2 (RSVP)
6. Notification Outbox Pattern (Reliability)
7. Event System Phase 3 (Advanced)
8. API Standardization
9. UI/Performance Improvements
10. Other Missing Features


