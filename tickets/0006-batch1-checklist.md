Batch 1 — Tenant API Error‑Handling Checklist

Purpose
- Precise per-file checklist for standardizing error handling in high-impact tenant routes.
- Use `lib/api-response.ts` helpers: `withErrorHandling`, `handleApiError`, `unauthorized`, `forbidden`, `notFound`, `validationError`, `conflict`.

How to use this checklist
- For each file below:
  - Add the listed imports from `lib/api-response.ts`.
  - Replace the ad-hoc response returns described with the suggested helper call.
  - Choose either: wrap exported handler with `withErrorHandling(...)` or keep try/catch but call `handleApiError(err, { context })` in the catch block.
  - Preserve any side-effects noted (logging, metrics) by invoking them prior to calling `handleApiError` or by augmenting the `handleApiError` call.
  - Run targeted tests listed under "Tests to run" after the change.

Batch 1 Files

1) `app/api/tenants/[tenantId]/posts/route.ts`
- Imports to add: `withErrorHandling`, `validationError`, `unauthorized`, `forbidden`, `handleApiError`
- Replace: ad-hoc validation / permission returns (e.g., `NextResponse.json({ error: '...' }, { status: 400 })`, `new Response(null, { status: 401 })`) -> use `validationError('...')`, `unauthorized()`, `forbidden()` respectively
- Handler strategy: Wrap exported handlers with `withErrorHandling` (unless file has catch side-effects — see below)
- Preserve side-effects: none significant; preserve `logger.*` calls if present by calling them before rethrow
- Tests to run: `test-suite/api-tests.ts` (posts sections) and `test-suite/feature-tests.ts`

2) `app/api/tenants/[tenantId]/posts/[postId]/route.ts`
- Imports to add: `withErrorHandling`, `notFound`, `forbidden`, `unauthorized`, `handleApiError`
- Replace: ad-hoc `404` / `403` returns -> `notFound('Post not found')`, `forbidden('Not allowed to edit post')`
- Handler strategy: Prefer explicit `try/catch` -> replace catch body with `handleApiError(err, { tenantId, userId, path: 'posts/[postId]' })`.
- Preserve side-effects: If `catch` logs stack or increments metrics, keep those calls before `handleApiError`.
- Tests to run: `test-suite/api-tests.ts` (post detail, edit, delete)

3) `app/api/tenants/[tenantId]/posts/[postId]/comments/route.ts`
- Imports: `withErrorHandling`, `validationError`, `notFound`, `unauthorized`, `handleApiError`
- Replace: ad-hoc validation/404 -> `validationError(...)`, `notFound(...)`
- Handler strategy: Wrap exported handlers with `withErrorHandling` if simple; otherwise maintain try/catch and call `handleApiError` in catch
- Preserve side-effects: none expected
- Tests: `test-suite/api-tests.ts` (comments), `test-suite/feature-tests.ts`

4) `app/api/tenants/[tenantId]/events/route.ts`
- Imports: `withErrorHandling`, `validationError`, `unauthorized`, `forbidden`, `handleApiError`
- Replace: ad-hoc validation and permission responses -> use `validationError` / `unauthorized` / `forbidden`
- Handler strategy: Wrap POST with `withErrorHandling`; GET may remain simple with try/catch + `handleApiError`
- Preserve side-effects: logging for RSVP or calendar integration; ensure logs happen before handler returns
- Tests: `test-suite/api-tests.ts` (events), `test-suite/feature-tests.ts`

5) `app/api/tenants/[tenantId]/events/[eventId]/route.ts`
- Imports: `withErrorHandling`, `notFound`, `forbidden`, `unauthorized`, `handleApiError`
- Replace: ad-hoc 404/403 returns -> use `notFound(...)`, `forbidden(...)`
- Handler strategy: Prefer explicit try/catch + `handleApiError` because event edits often have local cleanup side-effects
- Preserve side-effects: any notification enqueues — ensure they are called or re-invoked before `handleApiError`
- Tests: `test-suite/api-tests.ts` (events detail)

6) `app/api/tenants/[tenantId]/members/route.ts`
- Imports: `withErrorHandling`, `unauthorized`, `forbidden`, `notFound`, `handleApiError`
- Replace: membership joins/approvals ad-hoc returns -> `validationError`/`forbidden`/`notFound`
- Handler strategy: Wrap with `withErrorHandling` where safe; use explicit `handleApiError` if membership checks perform side-effects
- Preserve side-effects: audit logging for membership changes — preserve calls before error handling
- Tests: `test-suite/permissions-tests.ts`, `test-suite/api-tests.ts`

7) `app/api/tenants/[tenantId]/members/[userId]/route.ts`
- Imports: `withErrorHandling`, `validationError`, `unauthorized`, `forbidden`, `notFound`, `handleApiError`
- Replace: ad-hoc 401/403/404 -> use helpers
- Handler strategy: explicit try/catch + `handleApiError` (member-level updates often have audit logging)
- Preserve side-effects: audit logs, email notifications (call them before error handling or re-emit in catch)
- Tests: `test-suite/permissions-tests.ts`, `test-suite/api-tests.ts`

8) `app/api/tenants/[tenantId]/photos/route.ts`
- Imports: `withErrorHandling`, `notFound`, `unauthorized`, `forbidden`, `handleApiError`
- Replace: 404/403 ad-hoc -> use `notFound()`/`forbidden()`
- Handler strategy: wrap with `withErrorHandling` for GET; keep explicit catches for upload flows
- Preserve side-effects: none beyond logging
- Tests: `test-suite/feature-tests.ts`, `test-suite/api-tests.ts`

9) `app/api/tenants/[tenantId]/admin/settings/route.ts`
- Imports: `withErrorHandling`, `validationError`, `unauthorized`, `forbidden`, `handleApiError`
- Replace: ad-hoc 401/403/400 -> helper equivalents
- Handler strategy: explicit try/catch + `handleApiError` (admin settings edits may have side-effects like reindexing or cache invalidation)
- Preserve side-effects: cache invalidation hooks — ensure they run before the error wrapper or are re-invoked inside catch when appropriate
- Tests: `test-suite/permissions-tests.ts`, `test-suite/api-tests.ts`

10) `app/api/tenants/[tenantId]/wall/route.ts`
- Imports: `withErrorHandling`, `notFound`, `unauthorized`, `forbidden`, `handleApiError`
- Replace: ad-hoc 4xx returns -> helpers
- Handler strategy: wrap GET with `withErrorHandling`; POST may keep try/catch if it does moderation side-effects
- Preserve side-effects: moderation logs
- Tests: `test-suite/feature-tests.ts`, `test-suite/api-tests.ts`

11) `app/api/tenants/[tenantId]/wall/comments/route.ts`
- Imports: `withErrorHandling`, `validationError`, `unauthorized`, `forbidden`, `handleApiError`
- Replace: validation/permission ad-hoc returns -> helpers
- Handler strategy: wrap with `withErrorHandling` if no side-effects; otherwise explicit catch
- Tests: `test-suite/feature-tests.ts`, `test-suite/api-tests.ts`

12) `app/api/tenants/[tenantId]/wall/hide/route.ts`
- Imports: `withErrorHandling`, `unauthorized`, `forbidden`, `handleApiError`
- Replace: `new Response(null, { status: 401 })` -> `unauthorized()`; `NextResponse.json({ error: 'Not allowed' }, { status: 403 })` -> `forbidden()`
- Handler strategy: explicit try/catch + `handleApiError` (moderation side-effects)
- Preserve side-effects: moderation audit logs
- Tests: `test-suite/api-tests.ts`, `test-suite/feature-tests.ts`

Notes on implementation strategy
- Prefer `withErrorHandling` where a handler is a pure function that only throws on unexpected errors and has no important catch side-effects.
- Prefer explicit `try/catch` + `handleApiError` when the catch block previously performed audit logging, enqueued background jobs, or did partial cleanup.
- When replacing ad-hoc error bodies, update tests that assert exact message bodies to validate `status` and `code` instead (see test helper recommendation below).

Test helper suggestion (to add in `test-suite/helpers/`)
- `parseApiError.ts` — extracts `{ status, body }` and normalizes both old ad-hoc errors and new ApiError shapes so tests can be updated with minimal churn.

Post-change validation
- After each file change:
  - Run the focused test subset for that domain (see "Tests to run").
  - If any test fails due to message content mismatches, update the test to assert `status` + `code` or loosen string assertions to `contains`.

Rollback guidance
- Commit one file per small PR; if a PR causes regressions, revert that single commit and investigate.
- Preserve the old ad-hoc returns in the PR diff as commented-out lines for quick reversion if needed.

---
Generated by automation: follow these exact edit steps per file to standardize error handling and keep PRs minimal and reviewable.
