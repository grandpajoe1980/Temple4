# CHANGELOG — Ticket 0007 (Tenant Isolation Audit)

2025-11-27 — Tenant Isolation Audit for Messaging & Donations

- Centralized membership assertions via `lib/tenant-isolation.ts` (`isApprovedMember`, `assertApprovedMember`).
- Hardened tenant-scoped notification enqueues: `lib/services/notification-service.ts` now requires `actorUserId` when `tenantId` is present and validates membership before enqueueing to the outbox.
- Migrated messaging notification writes to use `NotificationService.enqueueNotification` for authenticated actors; retained DB fallback for anonymous flows.
- Fixed concurrency race in direct message creation (`Prisma P2002`) by falling back to `findFirst` when a unique constraint collision occurs (`lib/data.ts`).
- Replaced ad-hoc membership checks in trip donations with `assertApprovedMember` and added `test-suite/trip-donations-isolation.spec.ts`.
- Added deterministic seeding helper and test coverage for messaging and donations isolation.

Notes

- `prisma/archive/seed.ts` still contains direct `prisma.notification.createMany` calls for deterministic seed data; conversion to the outbox is optional and listed as follow-up.
- Developer guidance: prefer `assertApprovedMember` for actor-driven tenant-scoped enforcement and `can(...)` for role/permission checks in admin flows.

Artifacts

- Test results saved under `test-results/` (multiple successful runs; latest run: 95/95 passing).