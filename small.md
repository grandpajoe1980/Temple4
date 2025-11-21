You’re basically asking for:

1. A complete feature set for Small Groups (with creation/deletion), and
2. A concrete implementation plan that devs can execute, with everything living on a single “pane of glass” page.

I cannot actually read your GitHub repo directly from here even though it’s public, so this plan is tech-agnostic and assumes a modern web stack (SPA frontend + JSON API). Your team can translate it into your actual stack.

---

## 1. Roles and Permissions

Define these clearly; everything else hangs off this.

* **Anonymous/Regular user (“Attendee”)**

  * View list of groups and details
  * Request to join (if group is open)
  * Leave group they’re a member of

* **Group Leader / Co-Leader**

  * Everything regular user can do
  * Edit their own group’s profile
  * Approve/deny join requests for their group
  * Add/remove members from their group
  * Add/edit/delete resources and announcements for their group

* **Admin**

  * Full CRUD on all groups
  * Hard delete or archive groups
  * Assign/reassign leaders
  * Override membership (force add/remove)
  * Toggle group status: Open / Closed / Full / Archived

---

## 2. Data Model

### 2.1 `groups` (SmallGroup)

Core entity.

* `id` (PK)
* `name`
* `slug` (for URLs, optional)
* `description`
* `category` (enum/string: “Bible Study”, “Men”, “Women”, “Couples”, “Youth”, “Prayer”, etc.)
* `image_url` (optional)
* `day_of_week` (enum: Sun–Sat)
* `start_time` (time)
* `frequency` (enum: `weekly`, `biweekly`, `monthly`, `other`)
* `format` (`in_person`, `online`, `hybrid`)
* `location_name` (e.g. “Room 204”, “Smith Home”, “Zoom”)
* `location_address` (free text)
* `online_meeting_link` (optional)
* `status` (`open`, `closed`, `full`, `archived`)
* `capacity` (nullable int)
* `age_focus` (string or enum: “Young Adults”, “Parents”, etc.)
* `language` (string)
* `has_childcare` (bool)
* `tags` (JSON array or join table)
* `created_by_user_id`
* `created_at`
* `updated_at`
* `archived_at` (nullable)

### 2.2 `group_leaders`

* `id`
* `group_id`
* `user_id`
* `role` (`leader`, `co_leader`)
* `created_at`

### 2.3 `group_members`

* `id`
* `group_id`
* `user_id`
* `status` (`pending`, `approved`, `rejected`, `left`)
* `joined_at` (nullable)
* `left_at` (nullable)
* `added_by_user_id` (nullable, for admin/leader adds)

### 2.4 `group_resources`

* `id`
* `group_id`
* `type` (`book_link`, `video_link`, `file`, `note`)
* `title`
* `description` (optional)
* `url` (for links)
* `file_id` / `file_path` (if you support uploads)
* `sort_order`
* `created_by_user_id`
* `created_at`
* `updated_at`

### 2.5 `group_announcements`

* `id`
* `group_id`
* `title`
* `body`
* `created_by_user_id`
* `created_at`
* `pinned` (bool)

This covers: profiles, membership, resources, announcements, and admin controls without overbuilding.

---

## 3. API Design

Adjust paths to match your existing API style.

### 3.1 Groups

* `GET /api/groups`

  * Query params: `status`, `category`, `day_of_week`, etc. (basic filters)
  * Returns list of basic group cards.

* `POST /api/groups` (Admin only, maybe leaders if allowed)

  * Body: group profile fields (name, description, schedule, etc.)
  * Creates a new group + optional initial leader mapping.

* `GET /api/groups/{id}`

  * Returns:

    * group profile
    * leaders
    * members (basic info)
    * pending join requests (if requester is leader/admin)
    * resources
    * announcements

* `PUT/PATCH /api/groups/{id}`

  * Auth: leader of this group or admin.
  * Update profile fields.

* `DELETE /api/groups/{id}`

  * Auth: admin.
  * Prefer soft delete / archive: set `status = archived`, `archived_at = now`.

* `POST /api/groups/{id}/status`

  * Body: `{ status: "open" | "closed" | "full" | "archived" }`

### 3.2 Membership

* `POST /api/groups/{id}/join`

  * For regular users.
  * If group `status == open`, create `group_members` with `status = pending` or `approved` depending on your rules.

* `POST /api/groups/{id}/leave`

  * Sets member status to `left`, `left_at` now.
  * Guard against the last leader leaving: require admin or transfer leadership first.

* `GET /api/groups/{id}/members`

  * Auth: leader/admin.
  * Returns: approved, pending, maybe left.

* `POST /api/groups/{id}/members/{userId}/approve`

  * Leader/admin approves join request.

* `POST /api/groups/{id}/members/{userId}/remove`

  * Leader/admin removes member.

* `POST /api/groups/{id}/leaders`

  * Admin: add leader/co-leader.

* `DELETE /api/groups/{id}/leaders/{userId}`

  * Admin: remove leader.

### 3.3 Resources

* `GET /api/groups/{id}/resources`
* `POST /api/groups/{id}/resources`
* `PUT/PATCH /api/groups/{id}/resources/{resourceId}`
* `DELETE /api/groups/{id}/resources/{resourceId}`

Leaders/admin manage these.

### 3.4 Announcements

* `GET /api/groups/{id}/announcements`
* `POST /api/groups/{id}/announcements`
* `PUT/PATCH /api/groups/{id}/announcements/{id}`
* `DELETE /api/groups/{id}/announcements/{id}`

Optional: email notification when a new announcement is created.

---

## 4. One-Page UX (“Pane of Glass”)

Goal: everything for small groups lives on `/small-groups`, with no full-page route changes.

### 4.1 Layout

* **Top**: Page title “Small Groups” + “Create Group” button (visible to admins).

* **Left (or top on mobile)**: Group list/cards.

  * Scrollable list, with:

    * Group name
    * Category
    * Day/time
    * Status badge (Open, Full, Closed)
  * Clicking a group:

    * Updates selected group in state
    * Updates URL with `?group={id}` or hash
    * Opens detail panel on the right

* **Right (Main detail panel)**: Single view with tabs.

  * Header: group name, category, day/time, location, status, leaders.
  * Tabs (or sections):

    1. Overview
    2. Members
    3. Resources
    4. Announcements
    5. Settings (leaders/admin only)

Everything updates via client-side calls; the route remains `/small-groups`.

### 4.2 Detail Tabs

**Overview tab**

* Group description
* Basic schedule and location
* Childcare/language notes
* “Join Group” or “Leave Group” button (based on membership + status)
* Display book/current study summary (top resource or special field)

**Members tab**

* Member list (name, maybe avatar)
* Pending requests (leaders/admin only)
* Actions:

  * Approve/deny for pending requests
  * Remove member (leaders/admin)
* At top: quick counts (Members N, Pending M)

**Resources tab**

* List grouped by type:

  * Book Links
  * Documents
  * Videos
  * Notes
* For leaders:

  * “Add Resource” button
  * Edit/delete icons per resource

**Announcements tab**

* Timeline feed:

  * Title, snippet, created_at, author
* “New announcement” for leaders:

  * Simple rich text or markdown, no need for full editor.
* Option to pin an announcement.

**Settings tab** (leaders/admin only)

* Edit group profile: name, description, schedule, location, status, capacity, tags, etc.
* Manage leaders:

  * List current leaders
  * Add co-leader (by email/name lookup)
  * Remove co-leader (with guardrails)
* Danger zone:

  * Admin-only “Archive group” / “Delete group permanently”.
  * Show consequences clearly (e.g., “Members will no longer see this group”).

### 4.3 Creation Flow

* “Create Group” button opens a modal or slides in the right-hand pane with an empty form (same fields as Settings).
* On save:

  * Create `group`
  * Add current user as leader if appropriate
  * Add to list on left and set as selected group
* Validation:

  * Required fields: name, description, day_of_week, start_time, format, status.

### 4.4 Deletion/Archiving Flow

* In Settings tab:

  * For admins:

    * `Archive Group` button: soft delete (recommended default).
    * Optional `Delete Permanently` if your product allows hard deletions.
* Confirmation dialog:

  * “Are you sure? This group will no longer appear for members. You can restore archived groups from the admin panel.” (if you support restore).

---

## 5. Implementation Plan (Step-by-Step for Dev Team)

Break this into backend, frontend, and QA.

### Phase 1 – Backend: Data and Permissions

1. **Define DB schema**

   * Add tables: `groups`, `group_leaders`, `group_members`, `group_resources`, `group_announcements`.
   * Write migrations.

2. **Integrate auth/roles**

   * Decide how to map existing users to:

     * `Admin`
     * `Group Leader`
     * Regular user
   * Implement helpers:

     * `isAdmin(user)`
     * `isGroupLeader(user, groupId)`
     * `isGroupMember(user, groupId)`

3. **Implement Group CRUD endpoints**

   * `GET /api/groups`
   * `GET /api/groups/{id}`
   * `POST /api/groups`
   * `PUT/PATCH /api/groups/{id}`
   * `DELETE /api/groups/{id}` (archive)
   * Apply permissions:

     * Create: admin (optionally certain users)
     * Update: admin or group leader
     * Delete: admin only

4. **Implement Membership endpoints**

   * Join/leave
   * Approve/reject
   * Add/remove members
   * Permissions:

     * Join/leave: any authenticated user
     * Approve/reject/add/remove: leader/admin

5. **Implement Resources + Announcements**

   * CRUD endpoints for `group_resources` and `group_announcements`.
   * Permissions:

     * Read: group members (or public, your choice)
     * Write: leaders/admin

6. **Add basic validation and error handling**

   * 400 for invalid input
   * 403 for permission issues
   * 404 for missing resources
   * Avoid leaking membership details to unauthorized users.

7. **Unit tests / integration tests**

   * Group creation permissions
   * Join/approval flows
   * Editing by leader vs non-leader

---

### Phase 2 – Frontend: Layout & State Management

1. **Create `SmallGroupsPage`**

   * Route: `/small-groups`
   * Layout: two columns on desktop, stacked on mobile.
   * Fetch initial group list from `GET /api/groups` on load.

2. **Group list component**

   * `SmallGroupList`

     * Props: groups, selectedGroupId, onSelectGroup
   * Shows basic details and status badges.
   * Handles scrolling.

3. **Detail panel scaffold**

   * `SmallGroupDetail`

     * Props: groupId
     * Fetch group details from `GET /api/groups/{id}`
     * Shows loading and empty states.
   * Implement tab navigation:

     * Overview | Members | Resources | Announcements | Settings

4. **State handling for selected group**

   * Keep `selectedGroupId` in state.
   * Sync with URL param `?group=` (optional but recommended).
   * On list click → set `selectedGroupId` → detail panel updates.

---

### Phase 3 – Frontend: Core Features

1. **Overview tab**

   * Display full profile and schedule.
   * “Join Group” button:

     * Calls `POST /api/groups/{id}/join`.
     * Show different states: Join / Pending / Member / Closed / Full.
   * “Leave Group” for current members.

2. **Members tab**

   * Show members list with names/avatars.
   * If leader/admin:

     * Show pending section with Approve/Reject buttons.
     * Remove member button (with confirmation).

3. **Resources tab**

   * List resources grouped by type.
   * If leader/admin:

     * “Add Resource” form (inline or modal).
     * Edit/delete controls.

4. **Announcements tab**

   * Display feed sorted newest first.
   * If leader/admin:

     * Simple “New announcement” form.
   * Optional: pin/unpin.

5. **Settings tab**

   * Edit group profile.
   * Manage leaders:

     * Add new leader via user search.
     * Remove co-leader.
   * Archive/delete controls (admins only).
   * Client-side form validation.

6. **Create group**

   * “Create Group” button on top of page.
   * Opens the same form used in Settings, but in “create” mode.
   * On success, refresh list, select new group.

---

### Phase 4 – Polish, UX, and Edge Cases

1. **Empty states**

   * No groups yet (admin sees “Create your first small group” CTA).
   * Group selected but no resources/announcements.
   * Not a member yet vs member views.

2. **Mobile behavior**

   * Collapse layout: show either list or detail, with a back button.
   * Use drawer/slide-over for detail on mobile if needed.

3. **Permissions in UI**

   * Hide action buttons if user lacks permission.
   * Disable join for `closed` or `archived` groups.
   * Don’t allow the only leader to leave without transferring leadership (show proper message).

4. **Accessibility**

   * ARIA labels for tabs, buttons, and dialogs.
   * Keyboard navigation for tab switching and modals.

5. **Basic performance**

   * Cache group list in state.
   * Only re-fetch group detail when `groupId` changes or after edits.

---

### Phase 5 – QA Checklist

* Can an admin:

  * Create a group?
  * Assign leaders?
  * Archive a group?
  * Edit any group?
* Can a leader:

  * Edit only their group?
  * Approve/reject join requests?
  * Add resources and announcements?
* Can a normal user:

  * Browse groups?
  * Join an open group?
  * See appropriate messaging for closed/full groups?
  * Leave a group and see UI update?
* Are resources and announcements visible and editable in the right contexts?
* Does the entire experience stay on `/small-groups` without full page reloads?

---

If you want, next step could be:

* I outline a concrete database migration file + example JSON responses for each endpoint, or
* A React component tree and data flow diagram tailored to how Temple4 is structured (once you paste or describe the existing tech stack).
