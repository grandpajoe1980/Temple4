# Event System Specification

## 1. Core Goals and Non-Goals

### Goals
1.  **Seamless Integration**: Events must feel native to the existing site, integrating with the global calendar, tenant dashboards, and member profiles.
2.  **Flexible Visibility**: Support public outreach events, member-only gatherings, and private leadership meetings with robust access control.
3.  **Simple RSVP & Capacity**: Allow users to register interest, enforce capacity limits automatically, and manage waitlists without manual admin intervention.
4.  **Volunteer Recruitment**: Enable members to sign up for volunteer roles directly within the event RSVP flow.
5.  **Rich Presentation**: Support poster images and rich text descriptions to make events attractive and informative.
6.  **Low Friction Creation**: "Quick Add" for simple events (date + title), with progressive disclosure for complex needs (ticketing, recurrence, etc.).
7.  **Reliable Notifications**: Automate confirmations and updates (cancellations, location changes) to attendees.

### Non-Goals
1.  **Complex Ticketing**: We are NOT building a full e-commerce ticketing platform (like Eventbrite/Ticketmaster) with assigned seating, multi-tier pricing, or complex refund workflows. Simple payments/donations only.
2.  **Advanced Resource Scheduling**: We are NOT building a full facility management system (HVAC integration, complex conflict resolution) in this phase, though we will do basic location conflict checks.
3.  **External Syndication**: We are NOT automatically posting events to Facebook/Eventbrite APIs in this version.

---

## 2. Data Model / Schema

### Entities

#### `Event`
The core entity representing a scheduled occurrence.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | String (CUID) | **Yes** | System generated. |
| `tenantId` | String | **Yes** | Tenant isolation. |
| `title` | String | **Yes** | Event name. |
| `description` | String (Rich Text) | No | Full details. |
| `startDateTime` | DateTime | **Yes** | |
| `endDateTime` | DateTime | **Yes** | Defaults to start + 1h if not provided. |
| `allDay` | Boolean | No | Default `false`. |
| `visibility` | Enum | **Yes** | `PUBLIC`, `MEMBERS_ONLY`, `PRIVATE_LINK`. Default `MEMBERS_ONLY`. |
| `status` | Enum | **Yes** | `DRAFT`, `PUBLISHED`, `CANCELLED`. Default `DRAFT`. |
| `capacityLimit` | Int | No | Null = unlimited. |
| `waitlistEnabled` | Boolean | No | Default `false`. |
| `locationText` | String | No | Free text location (e.g. "Main Hall" or "Zoom"). |
| `locationId` | String | No | Optional link to a `Facility` record. |
| `posterImageUrl` | String | No | URL to uploaded image. |
| `registrationRequired`| Boolean | No | Default `false`. If true, users must RSVP. |
| `registrationOpenAt` | DateTime | No | When RSVPs open. |
| `registrationCloseAt`| DateTime | No | When RSVPs close. |
| `price` | Decimal | No | Optional cost/donation amount. |
| `url` | String | No | External link (e.g. for Zoom or external registration). |
| `organizerId` | String | No | Link to `User` (Member) who is the host. |
| `cancellationReason` | String | No | If status is CANCELLED. |
| `tags` | String[] | No | Array of tags/categories. |
| `createdAt` | DateTime | **Yes** | System. |
| `updatedAt` | DateTime | **Yes** | System. |

#### `EventRSVP`
Tracks user attendance.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | String (CUID) | **Yes** | |
| `eventId` | String | **Yes** | |
| `userId` | String | No | Required for logged-in users. Null for guest RSVPs (if allowed). |
| `guestEmail` | String | No | Required if `userId` is null. |
| `guestName` | String | No | Required if `userId` is null. |
| `status` | Enum | **Yes** | `GOING`, `INTERESTED`, `DECLINED`, `WAITLISTED`. |
| `role` | Enum | No | `ATTENDEE`, `VOLUNTEER`. Default `ATTENDEE`. |
| `notes` | String | No | Dietary restrictions, etc. |
| `checkInTime` | DateTime | No | For attendance tracking. |
| `createdAt` | DateTime | **Yes** | |

#### `EventVolunteerRole` (Optional Extension)
Specific volunteer needs for an event.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | **Yes** | |
| `eventId` | String | **Yes** | |
| `roleName` | String | **Yes** | e.g. "Greeter", "Setup Crew". |
| `capacity` | Int | **Yes** | How many needed. |

### Recurrence Strategy
For Phase 1/2, we will treat recurring events as **individual records** created in batch.
*   **Model**: Add `recurrenceGroupId` (String) to `Event`.
*   **Creation**: When creating a recurring event, the system generates distinct `Event` rows for each occurrence (up to a limit, e.g., 1 year out).
*   **Editing**: User can choose to "Edit this event only" or "Edit this and future events" (which updates all events with same `recurrenceGroupId` and `startDateTime >= current`).

---

## 3. Permissions and Roles

| Role | Create/Edit Events | Cancel Events | View Members-Only | RSVP | Manage RSVPs |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Event Manager** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Group Leader** | ✅ (Own Group) | ✅ (Own Group) | ✅ | ✅ | ✅ (Own Group) |
| **Member** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Public/Anon** | ❌ | ❌ | ❌ | ✅ (If Public) | ❌ |

**Visibility Logic:**
*   `PUBLIC`: Visible to `Auth.guest` and `Auth.user`.
*   `MEMBERS_ONLY`: Visible only if `Auth.user` has `APPROVED` membership in the tenant.
*   `PRIVATE_LINK`: Visible only if accessed via direct URL (UUID/Slug) AND user has permission (or if it's a "shareable" link).

---

## 4. Event Creation and Editing Flow

### UX Philosophy: "Progressive Disclosure"

**Step 1: The Basics (Quick Add)**
*   Modal or simple form.
*   Fields: Title, Date, Time, Duration.
*   Action: "Create Draft" or "Publish Now".

**Step 2: The Details (Full Editor)**
*   **General**: Description (Rich Text), Poster Image upload.
*   **Location**: Toggle between "On-site" (dropdown of Facilities) or "Off-site" (text field).
*   **Registration**: Toggle "Registration Required?". If Yes -> Show Capacity, Waitlist, Open/Close dates.
*   **Volunteers**: "Need volunteers?" -> Add roles (e.g., "Setup: 2 people").
*   **Visibility**: Radio buttons (Public / Members Only).

### Handling Changes
*   **Draft**: No notifications.
*   **Published**:
    *   **Minor Edit** (Typos, Description): Silent update.
    *   **Major Edit** (Time, Location): Prompt "Notify attendees?". If yes, trigger email/notification.
    *   **Cancellation**: Required "Reason" field. Triggers immediate email to all `GOING` and `WAITLISTED` RSVPs. Status changes to `CANCELLED` (event remains visible but grayed out).

---

## 5. Integration with Site

### Calendar View
*   **Monthly/Weekly Grid**: Shows colored dots/bars for events.
*   **Filters**:
    *   **Type**: Social, Service, Class, etc.
    *   **Audience**: Public vs Member.
    *   **My Events**: Only ones I've RSVP'd to.
*   **Hover**: Tooltip with Poster thumbnail, Title, Time, Location.

### Event Detail Page
*   **Header**: Large Poster Image (Hero).
*   **Sidebar/Sticky**: Date/Time, Location (Map link), "Register" button.
*   **Main Content**: Description, Schedule, Speaker info.
*   **Footer**: "Hosted by [Group Name]".

### Group Pages
*   "Upcoming Events" tab on Group profiles.
*   Automatically filters global event list by `organizerGroupId`.

---

## 6. RSVP & Registration System

### User Flow
1.  User clicks "Register" or "RSVP".
2.  **If Logged In**: Pre-filled info. Select status: "Going", "Not Going".
    *   *Optional*: "I can also volunteer as: [Dropdown]".
3.  **If Anonymous (Public events only)**: Prompt for Name + Email. Captcha required.
4.  **Confirmation**: Toast message + Email confirmation with `.ics` file.

### Capacity & Waitlist Logic
1.  **Capacity Reached**: Button changes to "Join Waitlist".
2.  **Waitlist Join**: User added with status `WAITLISTED`.
3.  **Spot Opens**:
    *   *Option A (Auto)*: First waitlisted person auto-promoted to `GOING`. Email sent.
    *   *Option B (Manual)*: Admin selects from waitlist.

### Admin Tools
*   **Attendee List**: Table showing Name, Status, Role, Notes, Email.
*   **Actions**: "Check-in", "Cancel RSVP", "Export CSV".
*   **Volunteer View**: Separate tab showing filled/open volunteer slots.

---

## 7. Access Control & Visibility Rules

*   **Public Listings**: Query `where: { visibility: 'PUBLIC', status: 'PUBLISHED' }`.
*   **Member Listings**: Query `where: { visibility: { in: ['PUBLIC', 'MEMBERS_ONLY'] }, status: 'PUBLISHED' }`.
*   **Private**: Only accessible via ID lookup, returns 403 if user doesn't have specific access rights (e.g., Group Member).

**UI Indicators**:
*   🔒 Lock icon for Members Only events.
*   ⚠️ "Waitlist Only" badge when full.
*   🚫 "Cancelled" banner if cancelled.

---

## 8. Image / Poster Handling

*   **Upload**: Drag-and-drop on Event Create/Edit form.
*   **Storage**: S3/Blob storage. Store `key` in DB.
*   **Specs**:
    *   Recommended: 16:9 aspect ratio (e.g., 1920x1080).
    *   Max size: 5MB.
    *   Formats: JPG, PNG, WEBP.
*   **Display**:
    *   *List View*: Thumbnail (cropped/cover).
    *   *Detail View*: Full width hero.
    *   *Calendar*: Tiny thumbnail in popover.

---

## 9. Edge Cases

*   **Overlapping Events**: Allow them (soft warning to Admin), but strictly prevent **Location** double-booking if a specific `Facility` is selected.
*   **Time Zones**: Store all times in UTC. Display in Tenant's configured timezone.
*   **Past Events**:
    *   RSVP disabled.
    *   "Write a recap" or "Upload photos" button appears for Organizers.
*   **Orphaned RSVPs**: If a user account is deleted, keep RSVP record but clear `userId` (GDPR compliance: anonymize name/email).

---

## 10. API Interface (REST)

*   `GET /api/tenants/:id/events`
    *   Query: `start`, `end`, `visibility`, `tag`.
*   `GET /api/tenants/:id/events/:eventId`
*   `POST /api/tenants/:id/events` (Create)
*   `PATCH /api/tenants/:id/events/:eventId` (Update)
*   `POST /api/tenants/:id/events/:eventId/rsvp`
    *   Body: `{ status: 'GOING', notes: '...', volunteerRole: '...' }`
*   `DELETE /api/tenants/:id/events/:eventId/rsvp` (Cancel RSVP)

---

## 11. Implementation Priorities

### Phase 1: The Basics (MVP)
*   **Goal**: Admins can list events, Members can see them.
*   **Features**:
    *   Event CRUD (Title, Time, Desc, Location, Visibility).
    *   Calendar View & List View.
    *   Members-only visibility enforcement.
    *   Poster image upload.

### Phase 2: Engagement (RSVP)
*   **Goal**: Users can interact.
*   **Features**:
    *   RSVP (Going/Not Going).
    *   Capacity limits.
    *   "My Events" list.
    *   Email notifications (Confirmation).

### Phase 3: Advanced
*   **Goal**: Full management.
*   **Features**:
    *   Waitlists.
    *   Volunteer signups.
    *   Recurring events generator.
    *   Check-in UI.
    *   Export to CSV.
