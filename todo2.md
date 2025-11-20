Here’s an assessment of the current state of `Temple4` based on the repository contents and the project’s own journal/todo, followed by a concrete TODO list focused on maintainability, feature correctness, and tests.

## 1. High‑level status

From `docs/todo.md` and `docs/journal.md`:

- Build is healthy:
  - TypeScript compilation: 0 errors.
  - Next.js production build: successful.
- Dev server: starts and serves all routes.
- Test baseline established:
  - 61 tests total.
  - 54 passing (≈88.5%).
  - 6 failing (all 401/404, mostly authentication/session related).
  - 1 skipped.
- Core domains are implemented:
  - Auth, tenants, membership, content, events, messaging, notifications, donations, volunteer/small groups, prayer wall, resources.
  - File uploads and email service integration are implemented and wired to real APIs.
- Documentation is unusually strong (README, DEVELOPER-GUIDE, SECURITY-AUDIT, lib/README, test-suite docs).

This is already a production‑ready baseline with some deliberate, documented technical debt.

---

## 2. Key areas needing improvement

### 2.1 Type system & technical debt

Findings:

- There is a known systemic mismatch between:
  - Legacy custom types in `types.ts`.
  - Prisma generated types.
- The current chosen strategy (documented in Ticket #0002 and the journal):
  - Use Prisma types as the source of truth.
  - Use a small number of `as any` casts, each annotated with TODO comments pointing to Ticket #0002.
- About a dozen `as any` casts remain, mostly in:
  - `app/tenants/[tenantId]/*` pages (members, volunteering).
  - `app/messages/page.tsx`, `app/explore/page.tsx`.
  - Some tenant tabs and components.
  - `lib/auth.ts`.

Impact:

- These casts reduce type safety and can hide bugs.
- They’re localized and documented, but finishing this alignment will improve maintainability and refactor‑safety.

### 2.2 Client/server boundaries

Findings:

- Earlier sessions show that a number of client components used to call async server functions directly.
- The current approach:
  - Minimal refactors: replace “async in initializer” and “async in render” with `useEffect` + loading states.
  - Deeper architectural refactors (API endpoints + DTOs) are described but deferred in Ticket #0002.

Impact:

- The current implementation works and is stable, but:
  - Some components still depend directly on internal data functions instead of clean API surfaces.
  - Long term, this makes it harder to change the backend without touching many components.

### 2.3 Tests: coverage and reliability

Findings:

- E2E/integration test suite is rich, with detailed documentation and harness:
  - `test-suite/` contains API, feature, page, permission, upload, and email tests.
- Current state:
  - 54/61 tests pass; all page tests pass (routing and rendering are solid).
  - All failing tests are related to:
    - Auth/session setup (401s).
    - One 404 around membership/search flow.
  - Test docs explicitly describe known gaps, original error backlog, and fixes.

Impact:

- Core flows are already heavily exercised.
- Remaining failures mostly represent either:
  - Known limitations of session handling in tests (not production bugs).
  - A small number of flows (e.g., search, membership queue, content creation from UI) not fully wired or not fully test‑harness‑compatible.

### 2.4 Consistency and clean‑up

Findings:

- Legacy Vite/CRA artifacts have been moved into `/legacy` and excluded from compilation.
- Some API routes and components are already using the new standardized:
  - `lib/api-response.ts` error helpers.
  - `lib/logger.ts` and audit logging.
  - `lib/tenant-context.ts` / `lib/tenant-isolation.ts`.

Impact:

- The patterns for good error handling, structured logging, and tenant isolation exist and are solid.
- Adoption is incomplete; a small fraction of routes still use ad‑hoc error handling or logging.

### 2.5 Accessibility & UX polish

Findings:

- Todo/journal explicitly mark:
  - Accessibility (keyboard nav, ARIA, screen readers) as “in progress.”
  - UX improvements have been started (toasts, empty/loading states) but not exhaustively applied to every feature.

Impact:

- App is usable and friendly, but:
  - Not yet systematically validated against WCAG.
  - Some flows may still fall back to generic errors or lack best‑practice ARIA attributes.

---

## 3. Focused TODO list to improve maintainability & correctness

Below is a concrete checklist, designed to be actionable in short sprints.

### 3.1 Finish type system alignment (Ticket #0002)

Goal: Eliminate `as any` and legacy custom types, standardize on Prisma + well‑typed DTOs.

Tasks:

1. Inventory remaining casts:
   - Search for `as any` and `TODO: Type mismatch - see Ticket #0002`.
   - Create a short list of affected files and functions.

2. Replace casts with explicit types:
   - For each component:
     - Define a clear prop/interface using Prisma types or narrow DTOs.
     - Add mapping functions in `lib/data.ts` or services to transform Prisma models → UI‑friendly DTOs.

3. Deprecate conflicting legacy types:
   - In `types.ts`:
     - Remove or mark as deprecated any types that duplicate Prisma models.
     - Keep only:
       - Enums that are not in Prisma.
       - Pure UI types (view models, filter objects, etc.).
   - Update imports throughout `app/` and `lib/` to use Prisma types (via `@prisma/client`).

4. Add unit tests around type‑sensitive helpers:
   - For major data helpers in `lib/data.ts`, add tests that:
     - Instantiate Prisma objects (or mocks) and ensure mapping functions produce the expected DTO shape.

Progress update:
- Tenants landing flow now uses Prisma tenant payload types end-to-end, with `getTenantsForUser` returning tenants that include `settings` and `branding`, and the selector/client components consuming those typed objects without `as any` casts.
- Tenant isolation helper now uses `Prisma.ModelName` typing for scoped model checks, eliminating the remaining `as any` cast in that guardrail.
- Podcasts client view now consumes Prisma-backed media DTOs with explicit Date hydration and profile-backed author avatars, removing the `as any` casts in `PodcastsPage`.
- Messages view now maps server-fetched user and conversation data into typed DTOs before hydrating the client component, eliminating the `as any` casts on `app/messages/page.tsx`.

Outcome: Strong, predictable type safety; easier refactors.

---

### 3.2 Harden the client/server architecture

Goal: Reduce coupling between React components and internal data functions, move to a cleaner API‑driven pattern where appropriate.

Tasks:

1. Pick 1–2 high‑traffic areas as pilots:
   - For example:
     - Tenant home dashboard.
     - Events page.
     - Prayer wall or Resource Center.

2. Introduce thin API routes if needed:
   - If any client component still calls server functions directly:
     - Add/confirm corresponding `/api/...` endpoint that:
       - Uses `lib/api-response.ts` for consistent errors.
       - Uses tenant context and permission helpers.
     - Change the client to call `fetch()` or Next server actions instead of importing data functions.

3. Encapsulate domain logic in services:
   - Organize files under `lib/` as a de facto service layer:
     - `lib/services/tenantService.ts` (or equivalent in `lib/data.ts` with clearer sections).
     - `lib/services/contentService.ts`, etc.
   - Route handlers should call these services; components should call APIs, not Prisma.

4. Extend docs:
   - In `lib/README.md` or `backend.md`, add a short section describing:
     - “Preferred pattern”: Component → API route → service → Prisma.

Outcome: Clear layering, fewer cross‑cutting imports, easier to change backend behavior without touching UI.

Progress update:
- Tenant home + events slice now fetch data through `/api/tenants/[tenantId]/events`, `/api/tenants/[tenantId]/posts`, and a new `/api/tenants/[tenantId]/members/me` endpoint instead of importing Prisma helpers in client components; the events API now returns creator + RSVP context so the UI keeps existing capabilities while respecting the API boundary.

---

### 3.3 Bring the tests from 88.5% → “green” where practical

Goal: Make the test suite a trustworthy regression guard, with failures either fixed or explicitly skipped with rationale.

Tasks:

1. Classify the 6 failing tests:
   - For each failing test, decide:
     - Is the behavior actually wrong in the app?
     - Or is the test harness missing proper auth/session setup?
   - Update test documentation with this classification.

2. Fix genuine feature gaps:
   - Where a 404/401 indicates a missing or partially‑implemented route/flow (e.g., membership flow, search flow):
     - Finish the API and/or UI wiring for that specific path.
     - Re‑run tests and confirm pass.

3. Fix auth/session setup in tests:
   - For tests that should be authenticated:
     - Ensure `test-suite/setup-test-users.ts` and `test-config.ts` establish sessions correctly (cookies, CSRF, etc.).
     - If the limitation is fundamental (e.g., HTTP‑only cookies not accessible to the testing tool), then:
       - Adjust tests to use server‑side session establishment endpoints where appropriate.
       - Or mark them `skipped` with a clear comment about the limitation.

4. Tighten assertions in existing tests:
   - Wherever tests assert only on status codes, consider modestly strengthening assertions to:
     - Validate shape of JSON payloads (IDs, titles, role sets).
     - Validate permission behavior (e.g., forbidden vs. not found).

5. Add a few critical missing tests:
   - Email service:
     - There is already `test-suite/email-tests.ts`. Ensure it covers:
       - Provider selection (mock vs Resend/SendGrid).
       - Logging to `EmailLog`.
       - Password‑reset flow integration.
   - File upload service:
     - Ensure `test-suite/upload-tests.ts` covers:
       - Per‑tenant directory structure.
       - Validation for MIME type and max size.
       - Quota enforcement and permission checks.

Outcome: Near‑fully green test suite, with any remaining skips/failures clearly documented and intentional.

---

### 3.4 Standardize error handling, logging, and tenant isolation

Goal: Apply the existing good patterns everywhere, not just in a subset of routes.

Tasks:

1. Error handling:
   - Use `withErrorHandling` (from `lib/api-response.ts`) across all route handlers where possible.
   - Ensure all route handlers:
     - Map validation errors to 400 with useful messages.
     - Map auth failures to 401/403 consistently.
     - Avoid leaking implementation details in production mode.

2. Logging:
   - Adopt `lib/logger.ts` in:
     - Auth routes (login, register, password reset).
     - High‑risk domains: donations, messaging, admin actions.
   - Use structured fields for:
     - `userId`, `tenantId`, `actionType`, and correlation IDs.

3. Tenant isolation helpers:
   - Ensure all tenant‑scoped routes use `lib/tenant-context.ts` / `lib/tenant-isolation.ts`:
     - No ad‑hoc `prisma.*` queries missing `tenantId` in `where` clauses.
   - Audit a small set of primary domains (posts, events, messages, donations) to confirm consistent usage.

Outcome: Predictable responses and logs; reduced risk of cross‑tenant leakage or ad‑hoc error patterns.

---

### 3.5 Accessibility and UX polish

Goal: Move from “good enough” to “polished” UX, with explicit accessibility passes.

Tasks:

1. Systematic accessibility sweep:
   - For key pages and components (navigation, modals, forms, resource lists):
     - Verify labels, ARIA attributes, focus order, and keyboard access.
   - Fix:
     - Missing `aria-label`/`aria-describedby` where necessary.
     - Focus trapping in dialogs and menus.

2. Empty/loading/error states completion:
   - Ensure for each major index/list page (posts, events, prayer wall, resources, volunteering, small groups):
     - There is a specific empty state (with copy and call‑to‑action).
     - Loading indicators are consistent (spinners/skeletons where appropriate).
     - Errors from API calls are surfaced in a user‑friendly way via the toast system and inline form messages.

3. UX of sensitive flows:
   - Registration, login, password reset, membership requests, donations:
     - Confirm success/failure messages are clear and non‑technical.
     - Confirm forms can be submitted entirely via keyboard.

Outcome: More robust, inclusive front‑end that better matches the quality of the backend.

---

## 4. Ensuring features work end‑to‑end

Given the current state (successful build, seeded data, 88.5% tests passing), most core features already work. To validate and maintain this:

- Maintain the seed:
  - Keep `prisma/seed.ts` synchronized with test expectations and UI demos.
- Use a lightweight manual test checklist for each release:
  - Auth: register → login → logout.
  - Tenant flows: create tenant → join tenant → approve membership → post content → create events.
  - Messaging: send message → verify notifications.
  - Donations (mocked): change settings → create mock record → verify leaderboard behavior.
  - File upload and email (mock providers): test upload and password reset in dev.

---

Here’s a focused set of concrete tickets you can drop into `tickets/` (or your issue tracker). Each includes:

- Narrow scope + guardrails to avoid regressions or “big refactors.”
- Clear “Definition of Done” / metrics of success.
- Alignment with the existing plan in `docs/todo.md` and Ticket #0002.

You can adapt the numbering to your existing scheme (`00xx-*.md`).

---

## Ticket 0003 – Eliminate Remaining `as any` Casts (Phase 1: High‑Risk Surfaces Only)

**Status:** OPEN  
**Area:** Type system, maintainability  
**Depends on:** Ticket #0002 – Type System Alignment

### Goal

Remove the remaining high‑impact `as any` casts while keeping the build green and behavior unchanged.

### Scope

- Only touch components and files where `as any` directly affect:
  - Auth/identity (user, memberships, roles).
  - Tenant boundary (tenant pages, members/volunteering views).
- Do NOT attempt to redesign the entire typing strategy in one go.

### Tasks

1. **Inventory casts (target list)**
   - Use `grep` / IDE search for `as any` and `TODO: Type mismatch - see Ticket #0002`.
   - Produce a markdown checklist inside this ticket with:
     - `[ ]` `app/tenants/[tenantId]/members/page.tsx`
     - `[ ]` `app/tenants/[tenantId]/volunteering/page.tsx`
     - `[ ]` `app/messages/page.tsx`
     - `[ ]` `app/explore/page.tsx`
     - `[ ]` `lib/auth.ts`
     - `[ ]` Any other file where `as any` touches user/tenant/role data.

2. **Replace casts with explicit types**
   - For each file in the checklist:
     - Replace `as any` on domain data with:
       - Either Prisma types (`User`, `Tenant`, `UserTenantMembership`, etc.).
       - Or explicit DTO interfaces declared in `types.ts` (or a nearby `types` file).
     - If a transformation is required (e.g., nested Prisma includes → flat UI shape), add a dedicated mapper function in `lib/data.ts` or a small helper nearby.

3. **Keep behavior identical**
   - Do not change:
     - Route URLs.
     - Business logic conditions.
   - Only adjust type annotations and mapping functions.

4. **Update Ticket #0002**
   - Record which `as any` locations have been removed as “Phase 1 complete” in Ticket #0002.

### Guardrails

- Do NOT:
  - Introduce new `any` or `unknown` anywhere.
  - Change public APIs, route signatures, or Prisma schema.
  - Move files or reorganize folders as part of this ticket.
- After each change, run:
  - `npm run lint` (if configured).
  - `npm run build`.

### Definition of Done

- All `as any` casts that directly affect auth/tenant/role data are removed or replaced by explicit types.
- `npm run build` passes (TypeScript still 0 errors).
- All 61 tests still run with:
  - 54 passing.
  - 6 failing, 1 skipped (unchanged baseline).
- Ticket #0002 updated to reflect which casts remain (if any).

---

## Ticket 0004 – Lock In Client/Server Boundaries for Tenant Home & Events (Pilot Only)

**Status:** OPEN  
**Area:** Architecture, maintainability  
**Depends on:** None (build is already green)

### Goal

Pilot a clean pattern for client/server separation on **one small vertical slice** (tenant home + events), without touching the rest of the app.

### Scope

- Only these routes/components:
  - `app/tenants/[tenantId]/page.tsx` (tenant home).
  - `app/tenants/[tenantId]/events/page.tsx` (events list page).
  - Any small shared components they directly use for listing events.
- Do NOT propagate changes beyond this vertical slice.

### Tasks

1. **Snapshot current behavior**
   - In dev:
     - Navigate to a seeded tenant’s home and events pages.
     - Capture:
       - URLs used (including query params).
       - Data shown (title, dates, counts).
   - Note current behavior in this ticket.

2. **Create/verify dedicated API for events**
   - Confirm there is a `GET /api/tenants/[tenantId]/events` route with:
     - Proper tenant isolation (`tenantId` scoped).
     - Permission checks (public vs member‑only, soft deletes).
   - If missing or incomplete:
     - Implement/fix it **using existing patterns**:
       - `withErrorHandling` from `lib/api-response.ts`.
       - `getTenantContext` / tenant isolation helpers.
       - `lib/logger.ts` for key logs.

3. **Update pages to use API (not internal data functions)**
   - Tenant events page:
     - Use `fetch('/api/tenants/.../events')` from a server component or a client component with `useEffect`.
     - Remove any direct imports of internal data helpers (e.g., from `lib/data.ts`) in that page.
   - Tenant home page:
     - If it shows a small subset of events, consume the same API (or a slimmed down version) instead of calling lib directly.

4. **Add a small test for the new pattern**
   - Add or extend an integration test in `test-suite/api-tests.ts`:
     - Assert that `GET /api/tenants/{tenantId}/events` returns the expected event structure and respects tenancy and visibility.

### Guardrails

- Do NOT:
  - Rename or move the `app/tenants` directory.
  - Change route params (`[tenantId]` vs `[slug]`).
  - Refactor other domains (posts, messaging, donations) as part of this ticket.
- Any new helper must:
  - Live in `lib/` (or a clearly named service file).
  - Be documented briefly in `lib/README.md` if it’s a reusable pattern.

### Definition of Done

- Tenant home & events pages use a clear API boundary:
  - No direct Prisma or `lib/data` calls from those pages.
- `GET /api/tenants/{tenantId}/events` is:
  - Fully tested (basic success + a permission/visibility case).
- `npm run build` and `npm run test:suite` pass with baseline results.

---

## Ticket 0005 – Make Failing Feature Tests Explicit and Stable

**Status:** OPEN  
**Area:** Testing, correctness  
**Depends on:** Existing test suite

### Goal

Turn the 6 failing tests into either:

- Passing tests verifying real behavior, or  
- Deliberately skipped tests with documented reasons and pointers to future work.

### Scope

- Only the known failing tests:
  - Search flow (401).
  - Membership flow (404).
  - Content creation flows (post, event, sermon) – 401s.
  - `GET /api/tenants/[tenantId]/community-posts` – 401.

### Tasks

1. **Classify each failure**
   - For each of the 6 failing tests:
     - Identify the exact test function name and file (e.g., `feature-tests.ts`).
     - Note:
       - Expected status (e.g., 200) vs actual (e.g., 401).
       - Whether the UI / API actually works manually in dev.

2. **Fix genuine missing behavior**
   - If manual testing shows the feature is incomplete (e.g., search or membership queue is not wired correctly):
     - Implement just enough backend/route logic for the test to reflect the intended behavior.
     - Keep changes minimal and confined to that route/flow.

3. **Fix auth/session setup where it’s a harness issue**
   - If the feature works in manual testing but fails in tests due to session/cookies:
     - Adjust `test-suite/setup-test-users.ts` / `test-config.ts` and test helpers to establish auth correctly.
     - If impossible due to HTTP‑only cookie constraints:
       - Mark those tests `skip` with a comment:
         - Why (test harness limitation).
         - What future work would make them viable.

4. **Document final status**
   - Update `test-suite/COMPLETION-SUMMARY.md` with:
     - A small table: test name → status (PASS / SKIP w/ reason).
     - Clear note that all remaining failures, if any, are intentional skips.

### Guardrails

- Do NOT:
  - Change the semantics for 401 vs 403 vs 404 in production code unless clearly wrong.
  - Loosen assertions to “just check 200” without verifying the response shape.
- Any test you skip must:
  - Have a comment referencing either:
    - A future ticket (e.g., “See ticket 000X for real search implementation”).
    - Or the explicit harness limitation.

### Definition of Done

- `npm run test:suite` produces:
  - 0 unexpected failures.
  - Any remaining non‑passing tests are clearly marked `skip` with rationale.
- `test-suite/COMPLETION-SUMMARY.md` reflects updated, accurate status.
- No production behavior was degraded; manual smoke test of:
  - Login, tenant view, creating content from UI.

---

## Ticket 0006 – Roll Out Standard Error Handling to All Tenant APIs

**Status:** OPEN  
**Area:** Error handling, consistency  
**Depends on:** `lib/api-response.ts` (already implemented)

### Goal

Ensure all tenant‑scoped API routes use the standardized error/response pattern from `lib/api-response.ts`.

### Scope

- All `app/api/tenants/[tenantId]/**/route.ts` files.
- Does not include global non‑tenant APIs (e.g. `/api/auth/[...nextauth]`).

### Tasks

1. **Route inventory**
   - List all tenant‑scoped API route files under `app/api/tenants/[tenantId]`.
   - Add them as a checklist in this ticket.

2. **Apply `withErrorHandling` wrapper**
   - For each route:
     - Wrap the handler with `withErrorHandling` (or related helpers) as used in the posts API example.
     - Replace raw `new Response(...)` / bare `return NextResponse.json({ error: ... })` error paths with:
       - `unauthorized()`, `forbidden()`, `notFound()`, `validationError()`, or generic `internalServerError()` from `lib/api-response.ts` as appropriate.

3. **Align status codes**
   - Confirm:
     - Unauthenticated → 401.
     - Authenticated but not permitted → 403.
     - Not found (tenant, resource) → 404.
   - Log unexpected errors via `handleApiError` and logger integration.

4. **Quick regression tests**
   - Extend or add a small set of tests in `test-suite/api-tests.ts`:
     - For a few representative tenant routes (posts, events, donations):
       - Assert on status codes and error shapes for not‑authed / not‑permitted / not‑found cases.

### Guardrails

- No business logic changes:
  - Do not change conditions determining who is allowed to do what.
  - Only standardize error paths and HTTP codes.
- Do not change route URLs or params.

### Definition of Done

- Every tenant‑scoped API route:
  - Uses `withErrorHandling` (or the same standardized pattern).
  - Returns structured error payloads consistent with `lib/api-response.ts`.
- Tests for at least 3 representative endpoints confirm error behavior.
- `npm run build` and `npm run test:suite` pass baseline.

---

## Ticket 0007 – Tenant Isolation Audit for Messaging & Donations

**Status:** OPEN  
**Area:** Security, correctness  
**Depends on:** `lib/tenant-isolation.ts`, existing Prisma schema

### Goal

Verify and enforce that messaging and donations never leak data across tenants.

### Scope

- Messaging models/routes:
  - `Conversation`, `ConversationParticipant`, `ChatMessage`.
  - Relevant routes under `app/api/conversations` and tenant messaging.
- Donations models/routes:
  - `DonationSettings`, `DonationRecord`.
  - Routes under `app/api/tenants/[tenantId]/donations/**`.

### Tasks

1. **Query review**
   - Inspect Prisma queries in messaging and donation routes and services.
   - For each query, verify:
     - It includes `tenantId` in the `where` clause where appropriate.
     - Or uses a helper that enforces tenancy.

2. **Introduce/use helper where needed**
   - Where routes access messaging/donations without explicit tenant scoping:
     - Use `getTenantContext` or a small helper in `lib/tenant-isolation.ts` to:
       - Resolve tenant.
       - Confirm membership and permissions.
       - Inject `tenantId` into queries.

3. **Add targeted tests**
   - Extend `permissions-tests.ts` or `api-tests.ts` to verify:
     - A user from Tenant A cannot:
       - Read conversations or donations from Tenant B.
       - See cross‑tenant records even if IDs are guessed.
   - Use seeded data (Springfield tenant and others) where possible.

### Guardrails

- Do NOT:
  - Change the messaging or donation feature surface (no new routes, no removal).
  - Implement new multi‑tenant messaging semantics; focus is isolation/security.
- If a query cannot be easily tenant‑scoped:
  - Document it in this ticket and propose a follow‑up ticket rather than “quick hacks.”

### Definition of Done

- All messaging and donation queries involving tenant‑scoped data:
  - Either use explicit `tenantId` filters.
  - Or are clearly validated as safe (documented exceptions).
- Tests demonstrate that cross‑tenant leakage is not possible via API.
- No existing passing tests regress.

**Progress (Session update):** Tenant‑scoped conversation endpoints now enforce approved membership before listing or reading messages, preventing users from accessing conversations tied to tenants they do not belong to. Conversation listings also apply tenant scoping at the query level so cross‑tenant threads are filtered out before unread counts or participant data are loaded.

---

## Ticket 0008 – Accessibility & UX Sweep for Core Navigation and Forms

**Status:** OPEN  
**Area:** Accessibility, UX  
**Depends on:** None

### Goal

Perform a focused, bounded accessibility and UX pass on **navigation + key auth/tenant forms**, without refactoring the entire UI.

### Scope

- Global navigation and Tenant navigation layout:
  - `app/layout.tsx`
  - `app/tenants/[tenantId]/layout.tsx`
  - Any primary nav components under `app/components`.
- Auth forms:
  - Login, register, forgot password, reset password.
- Tenant join/approve flow forms.

### Tasks

1. **Checklist against basic a11y criteria**
   - For the targeted pages/components, check:
     - Visible focus states on interactive elements.
     - Logical tab order.
     - Proper `<label>` and `htmlFor` / ARIA relationships for form controls.
     - `role="dialog"` and focus trapping for modals, if any.

2. **Fix obvious gaps**
   - Add:
     - Missing labels / `aria-label`.
     - `aria-describedby` for error messages on fields.
     - Keyboard handlers where clicks are required (e.g. Space/Enter on “button‑like” links).
   - Ensure toasts and inline errors:
     - Are perceivable by screen readers when feasible (e.g. `aria-live` where appropriate).

3. **Document scope & findings**
   - In `ui.md` or `DEVELOPER-GUIDE.md`, add a small section:
     - What has been explicitly checked.
     - Known remaining gaps (e.g., complex modals not yet audited).

### Guardrails

- No major redesign; visual look and layout should remain recognizable.
- Avoid adding dependencies; use existing component primitives.
- Don’t attempt to make **all** pages WCAG‑perfect in this ticket—keep it to the defined scope.

### Definition of Done

- Core navigation and auth/tenant forms:
  - Are keyboard navigable.
  - Have proper labels for all inputs.
  - Provide readable focus outlines.
- Any changes are documented succinctly in UI docs.
- `npm run build` and `npm run test:suite` still pass baseline.

---

If you tell me which of these you want to tackle first (e.g., “start with type alignment” or “fix test suite”), I can draft the exact `tickets/00xx-*.md` file contents in your house style, ready to commit.