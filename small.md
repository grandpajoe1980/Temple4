Small Groups — Temple4: refined design and implementation plan

Summary
-------
This document replaces the earlier brainstorm with a concrete, repo-aligned plan for implementing Small Groups inside Temple4. It makes explicit design decisions, maps features to existing code locations, and provides a phased rollout plan that minimizes surprise changes.

Key design decisions (defaults; confirm to finalize)
- Join policy: configurable per-group via `joinPolicy: "open" | "approval"` (default `approval`). `open` groups auto-approve joins; `approval` creates pending membership requiring leader action.
- Creation rights: default to `admins` and users with a tenant permission flag `create_groups`; this avoids sprawl while allowing opt-in power users.
- Leader management: group leaders may add/remove `co_leader` for their own group; only tenant `admin` can forcibly assign leaders across groups.
- Resources/uploads: reuse the existing site storage / resource patterns in `lib/` (no separate storage service), with per-group folder prefixing.
- Lifecycle states: groups will use `status` enum: `open | closed | full | archived`. `capacity` is enforced in API (reject or return `full` response when reached).

Data model (alignment notes for `schema.prisma`)
- Model: `SmallGroup`
  - id: String @id @default(cuid())
  - tenantId: String
  - name: String
  - slug: String? @unique
  - description: String?
  - category: String?
  - imageUrl: String?
  - dayOfWeek: String?  // enum in Prisma if desired
  - startTime: String?  // store as HH:MM or ISO time
  - frequency: String?  // weekly/biweekly/monthly/other
  - format: String? // in_person, online, hybrid
  - locationName: String?
  - locationAddress: String?
  - onlineMeetingLink: String?
  - status: SmallGroupStatus @default(approval)
  - joinPolicy: JoinPolicy @default(approval)
  - capacity: Int?
  - ageFocus: String?
  - language: String?
  - hasChildcare: Boolean @default(false)
  - tags: Json? // or join table
  - createdByUserId: String
  - createdAt: DateTime @default(now())
  - updatedAt: DateTime @updatedAt
  - archivedAt: DateTime?

- Model: `SmallGroupMember`
  - id, smallGroupId, userId
  - role: SmallGroupMemberRole (member | leader | co_leader | adminAdded)
  - status: MembershipStatus (pending | approved | rejected | left)
  - joinedAt: DateTime?
  - leftAt: DateTime?
  - addedByUserId: String?

- Model: `SmallGroupResource`, `SmallGroupAnnouncement` (fields as in original plan).

Migration notes
- Add enums: `SmallGroupStatus`, `JoinPolicy`, `MembershipStatus`, `SmallGroupMemberRole` to `schema.prisma` and run `prisma migrate dev --name add_small_groups_status`.
- Seed: add representative groups and membership rows in `prisma/seed.ts` to help frontend dev and tests.

API design (use the existing Next.js App Router under `app/api/tenants/[tenantId]/small-groups`)
- List/create: `GET /app/api/tenants/[tenantId]/small-groups` (supports filters: status, category, dayOfWeek, tag)
- Read/update/archive: `GET/PUT/DELETE /app/api/tenants/[tenantId]/small-groups/[groupId]` (DELETE -> soft archive)
- Status change: `POST /app/api/tenants/[tenantId]/small-groups/[groupId]/status` (body `{status}`)
- Membership actions:
  - `POST /app/api/tenants/[tenantId]/small-groups/[groupId]/join` (creates pending or approved member per `joinPolicy`)
  - `POST /app/api/tenants/[tenantId]/small-groups/[groupId]/leave`
  - `GET /app/api/tenants/[tenantId]/small-groups/[groupId]/members` (leader/admin only)
  - `POST /app/api/tenants/[tenantId]/small-groups/[groupId]/members/[userId]/approve`
  - `POST /app/api/tenants/[tenantId]/small-groups/[groupId]/members/[userId]/remove`
  - `POST /app/api/tenants/[tenantId]/small-groups/[groupId]/leaders` (add leader/co-leader)
  - `DELETE /app/api/tenants/[tenantId]/small-groups/[groupId]/leaders/[userId]`
- Resources/announcements: CRUD endpoints under `/resources` and `/announcements` subpaths.

Backend integration points (where to edit / add)
- `schema.prisma` (models + enums)
- `prisma/seed.ts` (add example groups)
- `lib/permissions.ts` (add `isGroupLeader(user, groupId)` and helpers)
- `lib/data.ts` (centralize small-group business logic: `createSmallGroup`, `joinSmallGroup`, `approveMember`)
- `lib/api-response.ts` (use standardized responses across small-group APIs)
- `app/api/tenants/[tenantId]/small-groups/*` (implement endpoints and enforce tenant isolation via `lib/tenant-isolation.ts`)
- `lib/audit.ts` / `lib/notifications.ts` (hook join requests and approvals to notify leaders)

Frontend integration points (reuse & extend)
- Route: `app/tenants/[tenantId]/small-groups/page.tsx` - entry for the pane-of-glass
- Components to update/create:
  - `SmallGroupList` (re-use `app/components/tenant/SmallGroupCard.tsx`)
  - `SmallGroupDetail` (new client component: tabs Overview / Members / Resources / Announcements / Settings)
  - `GroupAdminPanel` (admin/leader-only controls for approvals, leader management, archive)
  - `SmallGroupForm` (reuse existing `app/components/tenant/forms/SmallGroupForm.tsx` if present)
- State: keep `selectedGroupId` in page-level React state and sync with URL `?group=` for deep links.

Phased implementation (minimal risk, iterative)
1) Plan & schema (this document + `schema.prisma` changes)
   - Finalize decisions above.
   - Implement schema enums and models; create migration.
   - Acceptance: `prisma migrate dev` completes and `prisma generate` works.
2) Seed + tests
   - Add sample groups to `prisma/seed.ts` and basic unit tests covering membership status transitions.
   - Acceptance: test-suite runs and new tests pass locally.
3) Backend helpers + APIs
   - Implement small-group business logic in `lib/data.ts`; standardize API responses.
   - Implement endpoints under `app/api/tenants/[tenantId]/small-groups`.
   - Acceptance: curl/postman flows for create/join/approve/archive work and return standardized JSON.
4) Frontend pane-of-glass UI
   - Build `page.tsx` and `SmallGroupDetail` with tabs and wire API calls.
   - Ensure permission-based UI (hide actions when not leader/admin).
   - Acceptance: UX matches the pane-of-glass behavior; no full page reloads when navigating groups.
5) Polish, notifications, audits, and rollout
   - Hook notifications for pending joins; log major membership changes in `lib/audit.ts`.
   - Add Playwright scenarios and update `docs/DEVELOPER-GUIDE.md`.

Acceptance criteria (core flows)
- Admin can create/edit/archive groups and assign leaders.
- Leaders can approve/reject join requests, manage members, add resources/announcements.
- Users can view groups, request to join, and leave groups; `joinPolicy` respected.
- Capacity enforcement: API prevents joins when `capacity` reached and updates `status` to `full` if applicable.

Developer notes & commands
- To add schema changes and create a migration:
```
npx prisma migrate dev --name add_small_groups_status
```
- To seed dev DB after changes:
```
node prisma/seed.ts
```

Open questions (choose defaults or provide guidance)
1. Confirm `joinPolicy` default: `approval` (recommended) or `open`?
2. Confirm who can create groups: `admins` + users with `create_groups` permission (recommended), or everyone?
3. Confirm leaders' privileges: may a leader self-promote others to `co_leader`? (recommended yes, with audit).
4. Resource uploads: ok to reuse existing storage API and prefix files with `tenants/{tenantId}/groups/{groupId}/`?
5. Should capacity enforcement return HTTP 409 when full or a 200 with status `full`? (recommend 409 to make client handling explicit)

Next step
- Tell me choices for the open questions above and I will finalize this `small.md` plan. Once you confirm, I will prepare the migration and a focused implementation checklist for the next sprint.

-- Temple4 engineering
