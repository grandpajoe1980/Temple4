# Ticket 0006 — Batch 2 Checklist

Purpose: Finish standardizing API error handling across remaining tenant-scoped routes. Use `lib/api-response.ts` helpers (`handleApiError`, `unauthorized`, `forbidden`, `notFound`, `validationError`) and preserve existing logging/audit behavior.

Total tenant-scoped route files discovered: 71

Priority legend:
- High: permission-sensitive, comment/post flows, profile/profile-posts, requests, services, members, wall/prayer-wall, uploads — covered by many tests.
- Medium: admin sub-resources, facilities, bookings, events sub-resources, donations, podcasts, books.
- Low: read-only resources with low test coverage or static content.

## High Priority (implement first)
- `app/api/tenants/[tenantId]/community-posts/route.ts`
- `app/api/tenants/[tenantId]/community-posts/[postId]/route.ts`
- `app/api/tenants/[tenantId]/posts/route.ts` (already touched in batch1 — verify remaining handlers)
- `app/api/tenants/[tenantId]/posts/[postId]/route.ts` (verify remaining handlers)
- `app/api/tenants/[tenantId]/posts/[postId]/comments/route.ts` (already touched — verify)
- `app/api/tenants/[tenantId]/members/route.ts` (already touched — verify)
- `app/api/tenants/[tenantId]/members/[userId]/route.ts` (already touched — verify)
- `app/api/tenants/[tenantId]/members/[userId]/profile/route.ts`
- `app/api/tenants/[tenantId]/me/route.ts`
- `app/api/tenants/[tenantId]/requests/route.ts`
- `app/api/tenants/[tenantId]/requests/[userId]/route.ts`
- `app/api/tenants/[tenantId]/services/route.ts`
- `app/api/tenants/[tenantId]/services/[serviceId]/route.ts`
- `app/api/tenants/[tenantId]/wall/route.ts`
- `app/api/tenants/[tenantId]/wall/comments/route.ts` (verify)
- `app/api/tenants/[tenantId]/wall/hide/route.ts` (already updated — verify)
- `app/api/tenants/[tenantId]/photos/route.ts` (already touched — verify)
- `app/api/tenants/[tenantId]/upload` (if exists — ensure upload auth/validation)

## Medium Priority
- `app/api/tenants/[tenantId]/small-groups/route.ts`
- `app/api/tenants/[tenantId]/small-groups/[groupId]/route.ts`
- `app/api/tenants/[tenantId]/small-groups/[groupId]/announcements/route.ts`
- `app/api/tenants/[tenantId]/small-groups/[groupId]/announcements/[announcementId]/route.ts`
- `app/api/tenants/[tenantId]/small-groups/[groupId]/members/route.ts`
- `app/api/tenants/[tenantId]/small-groups/[groupId]/members/[userId]/route.ts`
- `app/api/tenants/[tenantId]/small-groups/[groupId]/members/[userId]/approve/route.ts`
- `app/api/tenants/[tenantId]/small-groups/[groupId]/members/[userId]/remove/route.ts`
- `app/api/tenants/[tenantId]/small-groups/[groupId]/members/[userId]/reject/route.ts`
- `app/api/tenants/[tenantId]/small-groups/[groupId]/leaders/route.ts`
- `app/api/tenants/[tenantId]/small-groups/[groupId]/tenant-users/route.ts`
- `app/api/tenants/[tenantId]/facilities/route.ts`
- `app/api/tenants/[tenantId]/facilities/[facilityId]/route.ts`
- `app/api/tenants/[tenantId]/facilities/[facilityId]/book/route.ts`
- `app/api/tenants/[tenantId]/facilities/[facilityId]/bookings/route.ts`
- `app/api/tenants/[tenantId]/facilities/bookings/[bookingId]/route.ts`
- `app/api/tenants/[tenantId]/trips/route.ts`
- `app/api/tenants/[tenantId]/trips/[tripId]/route.ts`
- `app/api/tenants/[tenantId]/trips/[tripId]/join/route.ts`
- `app/api/tenants/[tenantId]/trips/[tripId]/donations/route.ts`
- `app/api/tenants/[tenantId]/trips/[tripId]/members/[userId]/route.ts`
- `app/api/tenants/[tenantId]/trips/[tripId]/members/[userId]/approve/route.ts`

## Low Priority
- `app/api/tenants/[tenantId]/books/route.ts`
- `app/api/tenants/[tenantId]/books/[bookId]/route.ts`
- `app/api/tenants/[tenantId]/podcasts/route.ts`
- `app/api/tenants/[tenantId]/podcasts/[podcastId]/route.ts`
- `app/api/tenants/[tenantId]/sermons/route.ts`
- `app/api/tenants/[tenantId]/sermons/[sermonId]/route.ts`
- `app/api/tenants/[tenantId]/resources/route.ts`
- `app/api/tenants/[tenantId]/resources/[resourceId]/route.ts`
- `app/api/tenants/[tenantId]/books/[bookId]/route.ts`
- `app/api/tenants/[tenantId]/export/route.ts`
- `app/api/tenants/[tenantId]/donations/settings/route.ts`
- `app/api/tenants/[tenantId]/donations/records/route.ts`
- `app/api/tenants/[tenantId]/contact-submissions/route.ts`
- `app/api/tenants/[tenantId]/admin/*` (admin subresources already partially updated in Batch1; verify remaining)

---

Implementation notes:
- Preferred pattern per file:
  1. Import helpers: `handleApiError`, `unauthorized`, `forbidden`, `notFound`, `validationError` from `@/lib/api-response`.
  2. Replace ad-hoc `NextResponse.json({ error: '...' }, { status: 400 })` / `new NextResponse(null, { status: 204 })` where appropriate with helpers.
  3. For Zod errors use `handleApiError(zodError, { route, tenantId, ... })` so `handleApiError` will return a proper validation payload.
  4. Preserve logging lines (use `createRouteLogger` where available) and forward `error` to `handleApiError` with context in catch blocks.

Testing & rollout strategy:
- Work in small batches (3-6 files), run focused tests for impacted flows, then full `npm run test:suite`.
- Commit per-file changes with clear commit messages.

I will now update the tracked todo list to reflect this checklist and start implementing the high-priority group.
