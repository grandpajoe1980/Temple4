# Temple Platform – Architecture & Implementation Blueprint (`arch.md`)

This document is the single source of truth for what Temple **is supposed to be** and how it should be built and operated.

It merges:
- Product vision and feature set  
- Architecture and data model  
- History and major decisions  
- Technical standards and best practices  
- A future-focused TODO roadmap with measurable goals  

Treat this as the **north star spec**, not a status report. Anything described here is an expectation for the end state, regardless of the current implementation.

---

## 0. Purpose, Scope, and Audience

**Purpose**

- Define what a “done, production-grade Temple” looks like: product, architecture, operations.
- Give any new team enough context to safely evolve the system without rediscovering old decisions.
- Replace scattered docs (`projectplan.md`, `backend.md`, `todo*.md`, journals, etc.) with one coherent blueprint.

**Scope**

- Temple web application: product features, API, frontend, backend, database, and ops.
- **Multi-tenant SaaS**: one global platform, many “temples” (tenants).
- Excludes: native apps, non-web channels, billing infrastructure details.

**Audience**

- Senior/lead engineers responsible for architecture.
- New developers onboarding to Temple.
- Product/tech leads making roadmap decisions.

---

## 1. Product Vision

### 1.1 One-sentence vision

> Temple is a multi-tenant platform where any spiritual community can present itself, organize activities, and connect with people in a safe, modern, mobile-first web app.

### 1.2 Core value proposition

For each temple (tenant):

- A branded “home on the web” with:
  - About, beliefs, leadership, service times, directions, and contact info.
  - Multi-channel content: posts, sermons, podcasts, books, resources.
  - Calendar and events with RSVP/registration.
  - Donations, with optional donor leaderboard.
  - Volunteer opportunities and small groups.
  - Messaging, announcements, and prayer/community boards.

For each user:

- One account, multiple tenants.
- Ability to:
  - Discover temples.
  - Join as a member.
  - Participate in events, content, messaging, volunteering, giving.
  - Control privacy and notification preferences.

For platform administrators:

- Oversight and support across all tenants.
- Impersonation, audit logging, abuse handling, and platform configuration.

### 1.3 Design principles

1. **Monolith first**  
   Single Next.js + Prisma application. No microservices unless there is a clear, measurable scaling requirement.

2. **Strict multi-tenancy**  
   Every tenant-scoped row includes `tenantId`. All reads/writes are filtered/enforced by tenant and permissions.

3. **Predictable permissions**  
   No “inline” ad hoc permission checks. Permissions are centralized and testable.

4. **Type-safe by default**  
   Prisma types + strict TypeScript. No unreviewed `any`. DTOs are explicit.

5. **Observable and diagnosable**  
   Logging, audit trails, and metrics are first-class.

6. **Accessible and internationalizable**  
   Accessible UI, keyboard-friendly, screen-reader friendly; structure ready for multi-language content.

7. **Documented decisions**  
   Architecture decisions and trade-offs are documented here and via lightweight decision logs.

---

## 2. High-level Architecture

### 2.1 System overview

- **Client**: React/Next.js App Router (server and client components).
- **Server**: Node.js running Next.js route handlers and server components.
- **Auth**: NextAuth.js with credentials provider (email/password), CSRF, sessions.
- **Data layer**: Prisma ORM with SQLite in dev, Postgres in staging/production.
- **Storage**:
  - Database for structured data.
  - Object storage (S3/R2/Vercel Blob or equivalent) for uploaded files.
- **Email**: Pluggable provider (e.g., Resend or SendGrid) via `lib/email.ts`.
- **Search**: Database-backed search (LIKE/ILIKE) evolving toward proper full-text when migrated fully to Postgres.

### 2.2 Logical layers

1. **UI layer (Next.js pages & components)**
   - `app/tenants/[tenantId]/...` for tenant pages.
   - `app/auth/*`, `app/admin/*`, and global pages.
   - UI components in `app/components` and `components/ui`.

2. **API boundary**
   - `app/api/**/route.ts` route handlers.
   - Responsibilities:
     - Parse/validate HTTP input.
     - Retrieve authenticated session (real and effective user).
     - Resolve tenant context.
     - Call service functions.
     - Map service results to standardized HTTP responses.

3. **Service / domain logic**
   - Functions in `lib/` (or `lib/services/**`) encapsulate business rules:
     - Permission checks.
     - Complex workflows across multiple models.
     - Audit logging and notifications.
   - Example: `lib/tenant-service.ts`, `lib/events-service.ts`.

4. **Data access**
   - Prisma calls via `lib/db.ts` (Prisma client).
   - No business logic here; only queries and simple helpers.

5. **Cross-cutting utilities**
   - `lib/permissions.ts` – permission checks.
   - `lib/tenant-isolation.ts` – tenant scoping.
   - `lib/api-response.ts` – standardized responses and error wrappers.
   - `lib/logger.ts` – structured logging.
   - `lib/audit.ts` – audit logging.
   - `lib/email.ts` – email sending.
   - `lib/storage.ts` – file storage.

### 2.3 Request lifecycle (canonical pattern)

Example: user submits an event RSVP.

1. Client posts to `/api/tenants/[tenantId]/events/[eventId]/rsvp`.
2. Route handler:
   - Gets session (NextAuth).
   - Resolves tenant and membership (`getTenantContext`).
   - Validates input with Zod.
   - Calls `rsvpToEvent(userId, tenantId, eventId, status)` in service.
3. Service:
   - Confirms permissions: `can(user, tenant, 'events.rsvp')`.
   - Ensures event belongs to tenant.
   - Creates/updates `EventRSVP` row.
   - Writes audit event.
   - Optionally triggers notifications/emails.
4. Route handler:
   - Returns a standard success payload via `ok()` helper.
5. Client:
   - Updates UI (toasts, new RSVP state).

---

## 3. Domain Model (Conceptual)

### 3.1 Identity & Auth

**Core entities**

- `User`: global identity; owns login credentials.
- `UserProfile`: display name, avatar, bio, demographics (if configured).
- `UserPrivacySettings`: visibility of profile, contact info, etc.
- `AccountSettings`: password, MFA, login preferences.

**Capabilities**

- Registration with email/password and validation.
- Login/logout with secure session management.
- Password reset via email tokens.
- Optional impersonation: Super Admin can impersonate a user; both real/effective user tracked.

**Constraints**

- Passwords stored with bcrypt or better.
- Tokens stored hashed with expiry.
- Email verification optional but supported.

### 3.2 Tenants & Multi-tenancy

**Core entities**

- `Tenant`:
  - Name, slug, description.
  - Location (address, coordinates).
  - Public contact info.
  - Feature toggles and permissions JSON.
- `TenantBranding`:
  - Logo, colors, typography.
  - Social links (Facebook, YouTube, etc.).
- `TenantSettings`:
  - Feature toggles (calendar, posts, donations, etc.).
  - Quotas (storage, members).
  - Default role permissions and thresholds.

**Isolation rules**

- Every tenant-scoped table has `tenantId`.
- All queries are filtered by `tenantId` unless explicitly global (User, AuditLog, etc.).
- Non-super-admins must always act through a tenant context.

### 3.3 Membership, Roles, Permissions

**Membership**

- `UserTenantMembership`:
  - `userId`, `tenantId`, status (`PENDING`, `APPROVED`, `REJECTED`).
  - `joinedAt`, `leftAt`.
- `UserTenantRole`:
  - Roles per membership: MEMBER, STAFF, CLERGY, MODERATOR, ADMIN.
  - Multiple roles per user/tenant allowed.

**Permissions**

- Centralized interface in `lib/permissions.ts`.
- Cover domains like:
  - Manage members, content, events, donations, volunteers, messaging, settings.
- Role → permissions map defined on tenant via JSON and surfaced via control panel.

**Impersonation**

- Super Admin can impersonate:
  - Real user remains tracked.
  - Effective user used for UI and standard permission checks.
  - Impersonation banner clearly shown.
  - Audit log records start/stop of impersonation and impersonated actions.

### 3.4 Content: Posts, Sermons, Podcasts, Books

**Core entities**

- `Post`:
  - Tenant announcements/news.
  - Title, body, tags, visibility, `deletedAt` for soft delete.
- `PostComment` and `PostReaction`.
- `MediaItem`:
  - SERMON_VIDEO, PODCAST_AUDIO, etc.
  - Title, description, media URL/storageKey, duration, metadata.
- `Book`:
  - Author, title, summary, cover image, link to PDF or external source.

**Requirements**

- CRUD with permission checks:
  - Who can create/edit/delete/publish.
  - Draft vs published states.
- Visibility:
  - Public vs members-only.
- Search and filter:
  - By category, tag, series.
- Soft delete:
  - Use `deletedAt` consistently.

### 3.5 Events & Calendar

**Core entities**

- `Event`:
  - Title, description, start/end, location (physical/online), categories.
  - Recurrence support (future extension).
  - Visibility and capacity.
- `EventRSVP`:
  - `userId`, `eventId`, status (`GOING`, `INTERESTED`, `DECLINED`), timestamps.

**Requirements**

- Grid-style calendar for browsing by month/week.
- Event detail pages and list views.
- RSVP/registration flows:
  - Guests (email capture).
  - Members (link to account).
- Admin tools:
  - Capacity caps.
  - Export attendees for check-in.
- Integration points:
  - Volunteer needs linked to events.
  - Donations prompts (optional) tied to event campaigns.

### 3.6 Messaging

**Core entities**

- `Conversation`:
  - Global DMs and tenant channels.
- `ConversationParticipant`:
  - Membership, roles in conversation, last read message.
- `Message`:
  - Sender, content, attachments, `deletedAt`.
- `MessageReaction`.

**Requirements**

- Global direct messages and tenant-scoped channels.
- Read receipts (via lastReadMessageId).
- Permission-aware channel access:
  - Staff-only, volunteer-only, etc.
- Moderation:
  - Ability to delete messages.
  - Report/flag flows (future).

### 3.7 Notifications

**Core entities**

- `Notification`:
  - Type (e.g., NEW_MESSAGE, NEW_EVENT, PRAYER_REQUEST_REPLY).
  - Target user/tenant.
  - Read/unread state.
- `NotificationPreference`:
  - Per-type delivery preferences (in-app/email).

**Requirements**

- In-app notification center with unread counts.
- Email notifications based on preferences.
- Efficient fan-out patterns for events and community posts.

### 3.8 Donations & Finance

**Core entities**

- `DonationSettings`:
  - External donation link.
  - Suggested amounts.
  - Leaderboard toggle and configuration.
- `DonationRecord`:
  - Amount, currency, donor info, anonymity, tags (fund/campaign).

**Requirements**

- Initial implementation:
  - External payment provider links only.
  - No card handling in Temple.
- Leaderboard:
  - Optional, tenant-controlled.
  - Respects anonymity.
  - Time-bounded filters.
- Future:
  - Integrated providers (Stripe/Church-specific processors).
  - Pledges and statements.
  - Export reports.

### 3.9 Volunteer Management & Small Groups

**Volunteer**

- `VolunteerNeed`:
  - Title, description, required roles/skills, dates, capacity.
- `VolunteerSignup`:
  - User details, status, notes.

**Small Groups**

- `SmallGroup`:
  - Leader, meeting schedule, location, visibility (public/private).
- `SmallGroupMembership`:
  - Member, role, status.

**Requirements**

- Control panel views for admins:
  - Create/manage needs and groups.
- Member views:
  - Browse and sign up.
  - Filter by category, time, location.
- Integration:
  - Link groups and volunteer roles to events.

### 3.10 Resource Library, Prayer Wall, Facilities (Future/Extended)

**Resource Library**

- `ResourceItem`:
  - PDF, slides, forms, training material, etc.
  - Tags, categories, access level.
  - File upload via storage service.

**Prayer / Community Board**

- `CommunityPost`:
  - Type (PRAYER_REQUEST, PRAISE_REPORT, TANGIBLE_NEED).
  - Optional anonymity.
  - Moderation queue and statuses.

**Facilities / Service Planning**

- Scheduling of rooms, services, and equipment.
- Basic conflict detection.
- Integration with events and volunteers.

---

## 4. Cross-cutting Concerns

### 4.1 Security

- Strong password policies and hashing.
- CSRF protection on all state-changing requests.
- Rate limiting for auth endpoints.
- Role- and tenant-based access control everywhere.
- No secrets in client code or logs.

### 4.2 Tenant isolation

- All tenant-dependent operations go through helpers:
  - `getTenantContext(tenantSlugOrId, user)`:
    - Validates tenant existence.
    - Loads membership and roles.
    - Throws or returns a structured error for unauthorized access.
  - `assertHasTenantAccess(user, tenant, permission)`.

### 4.3 Data validation & error handling

- Zod schemas for all API inputs.
- Standard response helpers:
  - `ok(data)`, `badRequest(error)`, `unauthorized()`, `forbidden()`, `notFound()`, `serverError(error)`.
- API never returns raw stack traces to clients in production.
- Error boundary components on the frontend.

### 4.4 Logging & audit

- `lib/logger.ts`:
  - Structured fields: tenantId, userId, requestId, domain, action.
- `AuditLog` model:
  - Captures security-sensitive and admin actions (impersonation, permission changes, donations settings, etc.).
- Logs usable for:
  - Forensics.
  - Performance profiling.
  - Behavior insights.

### 4.5 File uploads

- `lib/storage.ts` abstracting underlying storage.
- Entities like `MediaItem` and `ResourceItem` store:
  - Public URL for consumption.
  - Internal `storageKey` for the object storage.
  - MIME type and file size.
- Validation:
  - Per-category file type and size limits.
- Back-pressure:
  - Tenant storage quotas enforced via `TenantSettings.maxStorageMB`.

### 4.6 Email

- `lib/email.ts` with pluggable provider.
- Common templates:
  - Password reset.
  - Welcome/activation.
  - Notifications summary.
  - Simple campaigns.
- `EmailLog` model for traceability:
  - Recipient, subject, provider, status, error message.

### 4.7 Search

- Tenant-scoped search over posts, events, media, and resources.
- API layer hides underlying implementation:
  - Initial: SQL LIKE queries.
  - Future: Postgres full-text or external search engine.
- Search routes enforce permissions and visibility.

### 4.8 Accessibility and i18n

- Minimum requirements:
  - Semantic HTML, labels, ARIA where necessary.
  - Keyboard-navigable without a mouse.
  - Color contrast meeting WCAG AA.
- i18n architecture:
  - Text extracted through a translation layer.
  - Content and UI strings separable by locale.

---

## 5. Frontend Architecture & UX Standards

### 5.1 Next.js App Router usage

- **Server components (default)**:
  - Fetch data via services.
  - Pass data as props to client components.
- **Client components**:
  - UI interactions, local state, browser APIs.
  - Never call Prisma or raw data functions directly.

### 5.2 Page structure

- `app/tenants/[tenantId]/`:
  - Layout handles tenant resolution, nav, permissions gating.
  - Child routes for dashboard, events, posts, groups, donations, messaging, etc.
- `app/auth/`:
  - Login, register, forgot/reset password.
- `app/admin/`:
  - Global admin console, impersonation tools.

### 5.3 UX expectations

- Clear empty, loading, and error states for every page.
- Toast notifications for success/error on actions.
- Mobile-first layout; desktop enhancements where available.
- Consistent forms:
  - Labels, helper text, inline validation.

---

## 6. Backend & Data Layer Details

### 6.1 Prisma schema guidelines

- Group models by domain with comments.
- Use `String` IDs with `cuid()` or `uuid()`.
- Add indexes for common queries (tenantId + createdAt, etc.).
- Use `deletedAt` for soft deletes; hard deletes only where safe.

### 6.2 Migrations

- Every schema change has a named migration.
- Standard workflow:
  - Update `schema.prisma`.
  - `npx prisma migrate dev --name change_name`.
  - Update types and services.
  - Add tests that exercise the new/changed behavior.

### 6.3 DTOs & type alignment

- Prisma types are the source of truth for persistence.
- DTOs exist for specific UI needs and are defined explicitly.
- No duplicate “shadow” model definitions that drift from Prisma.

---

## 7. Testing Strategy

### 7.1 Types of tests

- **Unit tests**:
  - Permission checks.
  - Pure utility functions.
- **Service tests**:
  - Domain logic that doesn’t involve HTTP.
- **API tests**:
  - Route handlers end-to-end, including authorization and validation.
- **Page tests**:
  - Ensure key pages render server-side, enforce redirects/guards.
- **Feature/workflow tests**:
  - Multi-step flows: join tenant, RSVP, donate, volunteer, etc.

### 7.2 Test infrastructure goals

- Stable, deterministic test database state (seed + fixtures).
- Helper utilities for:
  - Authenticated sessions.
  - Tenant creation.
  - Data seeding per test.

### 7.3 Quality targets

- Test suite pass rate:
  - Target: ≥ 95% of tests green on main.
- Coverage:
  - Aim for ≥ 80% coverage on service and API layers.
- CI:
  - On every PR: typecheck, lint, test, build.

---

## 8. Operational Practices

- Environments:
  - Dev, staging, production, with isolated databases.
- Config:
  - `.env` for secrets; never checked into version control.
- Monitoring:
  - Health checks for the app.
  - Logs aggregated centrally.
  - Basic metrics (request rates, errors, latency).

---

## 9. History & Decision Log (Condensed)

This section captures history as context, not as a statement of “done”.

- Early versions used a simulated backend (`seed-data.ts`) for rapid iteration.
- The system has since been realigned around:
  - Next.js App Router.
  - Prisma as the single source of truth.
  - Service patterns in `lib/**`.
- Multiple hardening cycles focused on:
  - Migrating to Next.js 16 async params.
  - Aligning custom types with Prisma.
  - Cleaning up legacy Vite/CRA artifacts.
  - Establishing a consistent test harness and work journals.
- Decision highlights:
  - Monolith with strong multi-tenancy instead of early microservices.
  - Prisma types as canonical; DTOs only where explicitly needed.
  - Centralized permissions and tenant isolation helpers.
  - Strong emphasis on documentation and onboarding (developer guide, security audit, etc.).

Use this section only for understanding why certain choices were made, not to assume any area is “good enough”.

---

## 10. TODO & Roadmap (Goals, Metrics, Tickets)

This section converts all outstanding ideas, debt, and expansion phases into **clear goals with measurable success criteria**, broken into tickets.

### 10.1 Platform Health & Type Safety

**Goal PH-1 – Type system alignment**

- **Objective**: Remove ad hoc type workarounds and ensure compile-time safety end-to-end.
- **Success metrics**:
  - TypeScript errors: 0 on main.
  - `grep -R "as any" src app lib` → 0 matches (or explicit, documented exceptions).
  - No custom types that duplicate Prisma models.

**Tickets**

- **[PH-1.1] Inventory and eliminate `as any`**
  - Find all uses of `as any` and document the underlying mismatch.
  - Replace each with properly typed DTOs or updated component props.

- **[PH-1.2] Deprecate legacy shadow types**
  - Audit `types.ts`.
  - Remove or clearly mark deprecated types that mirror Prisma models.
  - Update imports across codebase to use `@prisma/client` types plus explicit DTOs.

- **[PH-1.3] Add type-focused tests**
  - Add unit tests around DTO mappers and service functions that are known to be type-sensitive.
  - Use these tests to catch regressions when schema changes.

---

### 10.2 Client/Server Boundaries & Architecture Clean-up

**Goal PH-2 – Clean separation between UI and data**

- **Objective**: Ensure all data access flows through the intended layers and patterns.
- **Success metrics**:
  - Client components never import `lib/db.ts` or Prisma client.
  - All tenant-sensitive reads/writes go through service functions that enforce permissions.
  - Representative high-traffic flows tested end-to-end.

**Tickets**

- **[PH-2.1] Audit client components for data access violations**
  - Search for imports of data functions in client components.
  - Replace with API calls (or server components) as appropriate.

- **[PH-2.2] Introduce domain service modules**
  - Split large `lib/data.ts` (if still present) into domain-specific service modules.
  - Document the patterns in the developer guide.

- **[PH-2.3] Lock in patterns in developer guide**
  - Update the guide with concrete examples of approved patterns and anti-patterns.
  - Require code review enforcement of those patterns.

---

### 10.3 Testing, Reliability, and Coverage

**Goal QA-1 – Reliable, meaningful test suite**

- **Objective**: Turn the existing test suite into a trustworthy safety net with clear coverage.
- **Success metrics**:
  - Test pass rate on main ≥ 95%.
  - Coverage ≥ 80% for service and API layers.
  - No flakey tests on CI for 30 consecutive days.

**Tickets**

- **[QA-1.1] Fix auth/session-related test harness issues**
  - Ensure login helpers produce valid sessions across all suites.
  - Remove test-only hacks that bypass permissions.

- **[QA-1.2] Increase coverage for high-risk domains**
  - Donations, admin actions, impersonation flows, and volunteer management.
  - At least one end-to-end test per major workflow.

- **[QA-1.3] Add performance guardrails**
  - Simple smoke tests measuring p95 latency for key endpoints.
  - Document thresholds and fail CI if regressions exceed agreed limits.

---

### 10.4 Observability, Logging, and Audit

**Goal OPS-1 – Effective observability**

- **Objective**: Make Temple diagnosable in production within minutes, not hours.
- **Success metrics**:
  - 100% of API routes use standardized error handling.
  - Structured logging in all high-risk flows.
  - Audit logs exist and are queryable for major administrative actions.

**Tickets**

- **[OPS-1.1] Standardize API error handling**
  - Wrap all route handlers in `withErrorHandling` (or equivalent).
  - Ensure error responses have predictable structure.

- **[OPS-1.2] Adopt `logger` in security-critical areas**
  - Auth, donations, admin console, impersonation, volunteer approvals.
  - Each logs at least: userId, tenantId, action, outcome, key identifiers.

- **[OPS-1.3] Expand `AuditLog` coverage**
  - Ensure all sensitive actions (permissions changes, donation settings edits, impersonation start/stop, mass emails) write audit events.

---

### 10.5 Accessibility & UX Consistency

**Goal UX-1 – Baseline accessibility and UX polish**

- **Objective**: Ensure the app is usable across devices and assistive technologies.
- **Success metrics**:
  - Basic WCAG AA compliance on key flows (home, login, tenant dashboard, events, donations).
  - Keyboard-only navigation possible across primary UI.
  - All form fields have proper labels and error messages.

**Tickets**

- **[UX-1.1] Accessibility audit**
  - Run automated tooling and manual keyboard/screenreader checks.
  - Produce concrete issue list with severity.

- **[UX-1.2] Fix critical A11y issues**
  - Address high-severity issues first (missing labels, unreachable controls).
  - Re-test.

- **[UX-1.3] Standardize empty/loading/error states**
  - Define component patterns for these states.
  - Apply across content, events, donations, volunteer, and messaging pages.

---

### 10.6 Feature Expansion (Phases F–N Synthesis)

These capture “everything we ever wanted” consolidated into a phased roadmap, focusing on end state instead of current status.

**Goal FE-1 – Foundation features fully hardened**

- File uploads service robust for media and resources.
- Email service integrated across password reset, notifications, and campaigns.
- Search endpoints established and used by UI.

**Tickets (samples)**

- **[FE-1.1] Harden file upload flows**
  - Enforce per-tenant quotas.
  - Provide admin UI for storage usage.
  - Add tests for upload, delete, and permission checks.

- **[FE-1.2] Connect notifications to email**
  - Map key notifications types to email templates.
  - Respect user preferences and tenant toggles.

- **[FE-1.3] Implement tenant-scoped search API**
  - Unified `/api/tenants/[tenantId]/search` endpoint.
  - Support filtering by content type (posts/events/resources).
  - Wire tenant search bar to this endpoint.

---

**Goal FE-2 – Pastoral Care & Community**

- Prayer/community boards with moderation queues.
- Visitor follow-up flows.
- Enhanced small group and volunteer engagement tools.

**Tickets (samples)**

- **[FE-2.1] Implement moderated community board**
  - `CommunityPost` model with statuses.
  - Submission, moderation, and publish flows.
  - Notifications to moderators and authors.

- **[FE-2.2] Visitor follow-up pipeline**
  - Capture visitor contact data via forms.
  - Simple workflow: new visitor → follow-up task → track outcome.

- **[FE-2.3] Group and volunteer engagement metrics**
  - Simple per-tenant stats: active groups, attendance, volunteers engaged.
  - Dashboard widgets for admins.

---

**Goal FE-3 – Events & Service Operations**

- Strong events registration and check-in.
- Basic service planning and facilities coordination.

**Tickets (samples)**

- **[FE-3.1] Event registration enhancements**
  - Ticket types, capacity, and waitlists.
  - Printable/exportable attendee lists.

- **[FE-3.2] Check-in flow**
  - Event check-in UI for greeters.
  - Link check-ins to attendance metrics.

- **[FE-3.3] Facilities scheduling**
  - Reserve rooms/resources tied to events.
  - Prevent obvious conflicts and over-bookings.

---

**Goal FE-4 – Multi-language & Analytics**

- Multi-language content support.
- Admin analytics views across content/engagement.

**Tickets (samples)**

- **[FE-4.1] Basic i18n infrastructure**
  - Introduce translation framework for UI strings.
  - Allow per-tenant default locale configuration.

- **[FE-4.2] Content localization pilot**
  - Enable localized versions of posts and events for one pilot tenant.
  - Define data model for translations.

- **[FE-4.3] Admin analytics dashboard**
  - Aggregate views for:
    - Active members.
    - Event attendance trends.
    - Volunteer and donation engagement.
  - Filterable by tenant and time range.

---

This `arch.md` is the expected **end-state architecture and roadmap**. When in doubt about whether something is “done,” assume it needs verification against this document.

---

## 11. Unique Goals, Architecture Designs, and Additional Todos

### 11.1 Unique Goals

- **Community-first reliability**: Make Temple safe, fast, and available for small organizations with limited technical staff; mean-time-to-recover (MTTR) for tenant-impacting incidents should be under 30 minutes.
- **Privacy-by-default**: Default settings favor privacy (no public sharing for member data unless opted-in), with tenant-controlled toggles for public features.
- **Composable extensibility**: Design the codebase so features (search, donations, volunteers) can be enabled/disabled per-tenant with minimal coupling.
- **Developer-onboarding speed**: New developer should be able to run the app locally, run core tests, and make a small UI change within 60 minutes following the Developer Guide.
- **Measured simplicity**: Keep the first production architecture intentionally simple (monolith + Postgres + object storage) while enabling clean extraction later.

### 11.2 Architecture Designs (Concise Patterns)

- **Tenant Isolation Strategy**: Single logical database with strong `tenantId` scoping on all tenant tables. Use row-level security (RLS) in Postgres for additional safety when supported by the deployment environment; fall back to helper-enforced scoping otherwise.

- **Service Layer Contracts**: Every service method receives a typed `TenantContext` and `Actor` (real/effective user). Signature example:

  ```ts
  type TenantContext = { tenantId: string; slug: string; settings: TenantSettings }
  async function createEvent(ctx: TenantContext, actor: Actor, payload: CreateEventDto) { ... }
  ```

- **Storage & CDN**: Store original uploads in object storage; generate signed URLs for private access. Use a CDN for public assets and an on-demand proxy for previewing restricted media.

- **Notification Fan-out**: Keep notification publishing asynchronous. Services write a normalized `Outbox` event (DB), a short-lived worker consumes the outbox and publishes to the notification subsystem (email, push, in-app), ensuring durability and observable retries.

- **Feature Flags**: Tenant-level feature toggles stored in `TenantSettings.features`. Use flags to gate experimental UI and backend flows; default to off for new tenants.

- **Migration Policy**: Migrations should be backwards-compatible when possible. For multi-step destructive changes, use a three-phase approach: add nullable columns/alternate fields -> migrate data -> remove old fields in a later migration.

### 11.3 Additional Project Todos (Actionable, Prioritized)

- **[UG-1] Community Reliability Runbook**
  - Create a short runbook with: incident triage steps, key dashboards, playbook for common tenant-impacting failures, and rollback steps. 
  - Acceptance: Runbook saved at `docs/ops-runbook.md` and a tabletop drill executed once.

- **[AD-1] Tenant RLS Pilot**
  - Implement row-level security rules for a small set of tenant tables in a staging Postgres environment and document the deployment implications.
  - Acceptance: RLS rules applied and validated with tests that assert disallowed access is rejected.

- **[AD-2] Outbox-backed Notifications**
  - Implement an `Outbox` table and a simple worker to publish email/in-app notifications with retry semantics.
  - Acceptance: Notifications are durably recorded and retried on temporary failures; tests for retry logic included.

- **[DEV-1] 60-minute Onboarding Checklist**
  - Create `docs/onboarding.md` with minimal local setup steps, seeded data, and one end-to-end smoke test to confirm local flow.
  - Acceptance: New developer follows the guide and runs the smoke test successfully in under 60 minutes.

- **[OPS-1] Backup & Restore Test**
  - Document and automate a periodic backup/restore verification for the primary Postgres database and object storage snapshots.
  - Acceptance: Automated restore practiced monthly in staging with verification steps.

---

Additions in this section are intentionally compact and actionable. If you want any of these items expanded into full tickets, acceptance tests, or follow-up docs, I can create them and stage the content into `arch.md` (or separate `docs/` files) as you prefer.
