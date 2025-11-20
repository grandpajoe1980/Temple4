
Below is a single, consolidated project plan for **Temple**, incorporating:

*   User system (accounts, roles, permissions, membership, impersonation)
*   Messaging (global DMs + tenant chats)
*   Content (posts, sermons, podcasts, books)
*   Events & grid-style calendar
*   Donations (fully fleshed out, including donation links and optional leaderboard feature with Control Panel toggles)
*   Contact Us pages and maps
*   Admin tooling, notifications, and non-functional requirements

Use this as the master spec for development.

---

# 1. Product Overview

**Name:** Temple
**Tagline:** “Find your temple, Find yourself”

Temple is a multi-tenant platform where churches and temples of all religions can:

*   Create their own “tenant” (Temple space) with custom branding.
*   Present information: about, service times, location, staff.
*   Connect with members (messaging, posts, events).
*   Publish and host/aggregate sermons, podcasts, and long-form writings.
*   Coordinate schedules and events through a calendar with a **grid-style date picker**.
*   Accept **donations** (initially via external links, later via integrated providers).
*   Optionally show **donor leaderboards**.
*   Provide a **Contact Us** page with address and map.
*   Be moderated and supported by a platform Super Admin, including **impersonation** and auditing.

One global user account, many tenants. Users can:

*   Search for temples.
*   Join multiple temples.
*   Message other users globally and within tenants.
*   Interact with content based on permissions.

---

# 2. Roles and Permissions

This section defines the conceptual model, which has been implemented in both `types.ts` and the Prisma-backed permission-checking logic in `lib/permissions.ts`.

## 2.1 Global Roles

*   **Anonymous visitor** – not logged in.
*   **Authenticated user** – logged in, no special global powers.
*   **Platform Super Admin**

## 2.2 Tenant Roles

Per tenant:

*   **Member** – approved member of the temple.
*   **Staff / Clergy** – elevated content roles (default full posting rights).
*   **Moderator** – moderation authority over content and messaging.
*   **Tenant Admin** – full control of that tenant (settings, membership, permissions).

## 2.3 Role Permissions (High Level)

Within a tenant, abilities are controlled by:

*   Role (Member / Staff / Clergy / Moderator / Admin).
*   Tenant feature toggles (on/off per feature).
*   Tenant role-permission matrix (Control Panel).

Platform Super Admin overrides all tenant-level restrictions.

---

# 3. Multi-Tenancy Model

Multi-tenancy is enforced at the data layer via Prisma. Tenant isolation and membership-aware access checks are centralized in helpers like `getTenantContext` within `lib/tenant-context.ts`, which loads tenant settings/branding and validates membership before tenant-scoped pages render. Route handling now lives in the Next.js `app` directory (e.g., `app/tenants/[tenantId]`), not the legacy `App.tsx` state container. No `seed-data.ts` file exists in the current codebase; data flows through the Prisma client.

---

# 4. Data Model (Conceptual)

The conceptual data model lives in both `types.ts` and the Prisma schema (`schema.prisma`). Core objects (users, tenants, membership, content, messaging, audit) are already represented in the database schema. Donation and contact submission models are present in `schema.prisma`, and related tenant settings are persisted via Prisma rather than temporary seed structures.

## 4.1-4.7 Core Models (User, Tenant, Content, etc.)

*   **Status:** COMPLETED
*   **Implementation:** All core models for users, tenants, membership, content, events, messaging, and notifications have been defined in `types.ts` and persisted in the Prisma schema. Application data access flows through Prisma helpers in `lib/data.ts`, not `seed-data.ts`.

## 4.8 Donations (Fully Detailed)

*   **Status:** COMPLETED
*   **Implementation:**
    *   `DonationSettings` and `DonationRecord` interfaces are defined in `types.ts`.
    *   Donation settings are stored on the tenant record (see `donationSettings` and `enableDonations` in `schema.prisma`), and donation entries persist in the `DonationRecord` model rather than mock seed data.

## 4.9 Impersonation & Audit

*   **Status:** COMPLETED
*   **Implementation:** The `AuditLog` type is defined in `types.ts` and persisted via Prisma (`schema.prisma`). Audit events are recorded with the `logAuditEvent` helper in `lib/audit.ts`. Impersonation is surfaced through dedicated API routes and client components like `ImpersonationController`/`ImpersonationBanner` in `app/components/admin`, rather than legacy `App.tsx` state.

## 4.10 Small Groups & Ministries

*   **Status:** COMPLETED
*   **Implementation:**
    *   `SmallGroup` and `SmallGroupMembership` models defined in `types.ts`.
    *   Prisma models back small group data; CRUD flows use Next.js routes and components (`app/tenants/[tenantId]/small-groups`, `SmallGroupsTab.tsx`, `SmallGroupsPage.tsx`).
    *   Control Panel tab (`SmallGroupsTab.tsx`) and member-facing discovery page (`SmallGroupsPage.tsx`) are complete. The full lifecycle of creating, finding, and joining groups is functional.
*   **Identified Gaps:** Dedicated detail pages for each group with a discussion/post area are a potential future enhancement.

## 4.11 Volunteer Management

*   **Status:** COMPLETED
*   **Implementation:**
    *   `VolunteerNeed` and `VolunteerSignup` models defined in `types.ts`.
    *   Prisma models persist volunteer needs and signups; API routes under `app/api/volunteer-needs` support creation and updates.
    *   A "Volunteering" tab in the Control Panel allows admins to create and view needs.
    *   A "Volunteering" page in the tenant layout allows members to browse and sign up for opportunities.

## 4.12 Community Boards (Future)

**CommunityPost** (for Prayer Wall)

*   id
*   tenantId
*   authorUserId (nullable for anonymous)
*   type (PRAYER_REQUEST, TANGIBLE_NEED)
*   body
*   isAnonymous (bool)
*   status (PENDING_APPROVAL, PUBLISHED, FULFILLED)
*   createdAt

## 4.13 Live Streaming & Resources (Future)

**LiveStreamSettings**

*   tenantId (PK)
*   isEnabled (bool)
*   provider (YOUTUBE, FACEBOOK, VIMEO)
*   embedUrl
*   isLive (bool, manual toggle by admin)

**ResourceItem** (for downloads)

*   id
*   tenantId
*   uploaderUserId
*   title
*   description
*   fileUrl
*   fileType (PDF, MP3, DOCX)
*   visibility (PUBLIC, MEMBERS_ONLY)
*   createdAt

## 4.14 Advanced Operations (Future - High Level)

**Facility**

*   id, tenantId, name, capacity

**Booking**

*   id, facilityId, userId, startDateTime, endDateTime, status

**CheckinEvent**

*   id, tenantId, name, date

**CheckinRecord**

*   id, checkinEventId, childName, parentUserId, checkinTime, checkoutTime, securityCode

---

# 5. Core Features and Flows

This section details the application's features, broken down by development phase.

## Phase 0: Foundations (Authentication)

*   **Status:** COMPLETED
*   **Implementation Details:**
    *   Full authentication flow is implemented in `App.tsx`.
    *   UI components are complete: `LoginForm.tsx`, `RegisterForm.tsx`, `ForgotPasswordForm.tsx`, and `ResetPasswordForm.tsx`.
    *   Mock data handling for users and passwords is in `seed-data.ts`.

## Phase 1: Tenants & Search

*   **Status:** COMPLETED
*   **Implementation Details:**
    *   **Landing Page:** `LandingPage.tsx` provides the main entry point with a prominent search bar.
    *   **Tenant Search & Discovery:** Search queries from the landing page transition to `ExplorePage.tsx`, which displays filterable results using `TenantCard.tsx`.
    *   **Public Tenant View:** `PublicTenantPage.tsx` serves as the public-facing view for a tenant, including a header, navigation tabs for visible content, and a join/login flow.
    *   **Tenant Creation:** Logged-in users can create a new tenant via `CreateTenantForm.tsx`, which is accessible from `TenantSelector.tsx`.

## Phase 2: Membership & Control Panel

*   **Status:** COMPLETED
*   **Implementation Details:**
    *   **Control Panel:** The main UI in `ControlPanel.tsx` is fully functional with a tabbed interface.
    *   **Settings Tabs:** All planned tabs are implemented: `GeneralTab`, `BrandingTab`, `FeaturesTab`, `PermissionsTab`, `MembershipTab`, and `UserProfilesTab`.
    *   **Membership Management:** Admins can approve, reject, ban, and manage roles for members in the `MembershipTab`. Role editing is handled by `EditRolesModal.tsx`.
    *   **Permission Matrix:** Tenant admins can configure role-based permissions in `PermissionsTab.tsx`.
    *   **User Profile Management:** Super Admins can edit any user's profile via the `UserProfilesTab`, which uses the `EditUserProfileModal.tsx`.

## Phase 3: Content (Posts, Sermons, etc.)

*   **Status:** COMPLETED
*   **Implementation Details:**
    *   **Posts:** `PostsPage.tsx` allows for creation (via `PostForm.tsx` in a modal) and viewing of announcements and blogs using `PostCard.tsx`.
    *   **Sermons:** `SermonsPage.tsx` displays video embeds using `SermonCard.tsx`. Creation UI is a placeholder.
    *   **Podcasts:** `PodcastsPage.tsx` displays audio embeds using `PodcastCard.tsx`. Creation UI is a placeholder.
    *   **Books:** `BooksPage.tsx` displays long-form content using `BookCard.tsx`.
    *   All corresponding data functions (`getPostsForTenant`, etc.) are in `seed-data.ts`.

## Phase 4: Events & Calendar

*   **Status:** COMPLETED
*   **Implementation Details:**
    *   `EventsPage.tsx` provides a toggle between a list view and a calendar view.
    *   The `EventsCalendar.tsx` component implements the required month grid view. Clicking a day opens the `DayEventsModal.tsx`.
    *   Event creation (`EventForm.tsx`) uses a `Calendar.tsx` component, satisfying the "grid-style date picker" requirement.
*   **Identified Gaps:**
    *   **RSVP System:** The `EventRSVP` data model is in the plan but not yet in `types.ts` or `seed-data.ts`. The RSVP buttons on `EventCard.tsx` are placeholders.
        *   **Next Step:** Add `EventRSVP` to `types.ts` and create mock data/functions in `seed-data.ts`.
        *   **Next Step:** Wire up the "Going" and "Interested" buttons on `EventCard.tsx` to update the data.

## Phase 5: Messaging System

*   **Status:** COMPLETED
*   **Implementation Details:**
    *   **Global DMs:** The `/messages` view is handled by `MessagesPage.tsx`, allowing users to see all their conversations (DMs and tenant channels) and start new DMs via `NewMessageModal.tsx`.
    *   **Tenant Chat:** The `/t/:tenantSlug/chat` view is handled by `ChatPage.tsx`, which correctly scopes conversations to the active tenant.
    *   **Core Components:** `ConversationList.tsx`, `MessageStream.tsx`, and `ConversationDetailsPanel.tsx` provide a complete, real-time chat experience.
    *   **Moderation:** Message deletion is implemented in `MessageStream.tsx` and respects user permissions via `canDeleteMessage` in `lib/permissions.ts`.

## Phase 6: Notifications

*   **Status:** COMPLETED
*   **Implementation Details:**
    *   The `Notification` data model is defined in `types.ts`.
    *   The `NotificationBell.tsx` component displays an unread count and is present in all key headers (`App.tsx`, `TenantLayout.tsx`, `PublicTenantPage.tsx`).
    *   The `NotificationPanel.tsx` provides a dropdown list of recent notifications with read/unread states and navigation.
    *   The `seed-data.ts` file includes a `generateNotification` function that is triggered by key events like new direct messages, membership approvals, and new announcements.

## Phase 7: Admin & Impersonation & Audit

*   **Status:** COMPLETED
*   **Implementation Details:**
    *   **Impersonation:** The entire flow is complete. A Super Admin can start impersonating a user from the `MembershipTab` or `ProfilePage`, an `ImpersonationBanner.tsx` is displayed, and they can exit impersonation.
    *   **Audit Logging:** The `logAuditEvent` function is integrated throughout the application, capturing critical actions.
    *   **Admin Console:** A dedicated UI (`AdminConsole.tsx`) allows for viewing and filtering all `auditLogs`.

## Phase 8: Donations

*   **Status:** COMPLETED
*   **Implementation Details:**
    *   **Data Model:** `DonationSettings` and `DonationRecord` types are defined in `types.ts`. Mock donation data and management functions are implemented in `seed-data.ts`.
    *   **Control Panel Tab:** A dedicated `DonationsTab.tsx` allows tenant admins to configure donation modes (External vs. Integrated), suggested amounts, and leaderboard settings (visibility, timeframe).
    *   **Donations Page:** The `DonationsPage.tsx` provides the user-facing interface. It dynamically displays an external link or a mock integrated donation form based on tenant settings.
    *   **Leaderboard:** An optional donor leaderboard is included on the donations page, respecting anonymity settings and filtering by timeframe.
    *   **Navigation:** A "Donations" link is now present in the `TenantLayout.tsx` navigation, visible when the feature is enabled for the tenant.

## Phase 9: Contact & Maps & Polish

*   **Status:** COMPLETED
*   **Implementation Details:**
    *   **Data Model:** `contactEmail` and `phoneNumber` fields have been added to the `Tenant` interface in `types.ts`.
    *   **Control Panel:** The `GeneralTab.tsx` has been updated with fields to manage the new contact information.
    *   **Contact Page:** A new `ContactPage.tsx` has been created, which displays the tenant's address, contact details, an embedded map, and a functional contact form.
    *   **Navigation:** A "Contact" link is now available in the `TenantLayout.tsx` navigation bar.

## Phase 10: Community Core V2 (Part 1)

*   **Status:** COMPLETED
*   **Implementation Details:**
    *   **Volunteer Management:** The full feature is implemented.
        *   `VolunteerNeed` and `VolunteerSignup` data models are live in `types.ts` and `seed-data.ts`.
        *   A feature toggle is available in the `FeaturesTab`.
        *   A `VolunteeringTab` in the Control Panel allows admins to create and manage opportunities.
        *   A `VolunteeringPage` allows members to view needs and sign up, using the `VolunteerNeedCard`.

## Phase 11: Community Core V2 (Part 2)

*   **Small Groups / Ministries**:
    *   **Status:** COMPLETED
    *   **Implementation:**
        *   `SmallGroup` and `SmallGroupMembership` models are defined in `types.ts`.
        *   Mock data and management functions (`createSmallGroup`, `joinSmallGroup`, `leaveSmallGroup`) are in `seed-data.ts`.
        *   A "Small Groups" tab in the Control Panel (`SmallGroupsTab.tsx`) allows admins to create and view groups.
        *   A "Small Groups" page in the tenant layout (`SmallGroupsPage.tsx`) allows members to discover and join groups via `SmallGroupCard.tsx`.
    *   **Identified Gaps:** Group detail pages with dedicated discussion areas are not yet implemented.

*   **Live Streaming Integration**:
    *   **Status:** TO DO
    *   **Next Steps:**
        *   Create `LiveStreamSettings` data model.
        *   Add a "Live Stream" section in the Control Panel (Features or a new tab) to configure the embed URL and provider.
        *   Create a dedicated `/t/:tenantSlug/live` page to display the live stream embed.
        *   Implement a "We're Live!" indicator on the tenant home page that appears when an admin toggles the `isLive` flag.

## Phase 12 & Beyond – Platform Maturity**:
*   **Prayer Wall**:
    *   Create `CommunityPost` data model.
    *   Build a "Community Prayer Wall" page within the tenant layout.
    *   Implement a form for submitting prayer requests (with an anonymity option).
    *   Add moderation tools in the Control Panel for admins to approve/manage posts.
*   **Resource Center (Downloads)**:
    *   Create `ResourceItem` data model.
    *   Build a `/t/:tenantSlug/resources` page with functionality to upload (mock), categorize, and list downloadable files.
    *   Implement permissions for member-only resources.
*   **Facility & Room Booking**:
    *   A more complex feature for later. Involves creating a new calendar-based booking system for physical rooms and assets.
*   **Children's Ministry Check-in**:
    *   A long-term, highly specialized feature involving security tags, attendance tracking, and parent communication tools. This is a highly specialized, long-term goal.

---

# 6. Navigation & Layout

... (This section remains as specified) ...

---

# 7. Tech Stack & Project Structure

... (This section remains as specified) ...

---

# 8. Phases and Sprints (High-Level)

You can adapt sprint durations; this is logical sequence:

1.  **Phase 0 – Foundations**: Auth, basic layout.
2.  **Phase 1 – Tenants & Search**: Tenant creation, explore, landing search.
3.  **Phase 2 – Membership & Control Panel**: Settings, permissions, membership management.
4.  **Phase 3 – Content**: Posts, sermons, podcasts, books.
5.  **Phase 4 – Events & Calendar**: Event model, grid-style calendar and RSVPs.
6.  **Phase 5 – Messaging**: DMs and tenant chat.
7.  **Phase 6 – Notifications**: In-app and minimal email.
8.  **Phase 7 – Admin & Impersonation & Audit**: Admin console, impersonation banner, audit logs.
9.  **Phase 8 – Donations**: DonationSettings, DonationRecord, donation page, links, optional leaderboard.
10. **Phase 9 – Contact & Maps & Polish**: Contact Us per tenant, map embed, accessibility and UX enhancements, small gaps.
11. **Phase 10 – Community Core V2 (Volunteering)**: Volunteer needs, signups, admin UI, member UI.
12. **Phase 11 – Community Core V2 (Small Groups & Live Stream)**: Group discovery and management, live stream embeds.
13. **Phase 12 & Beyond – Platform Maturity**: Prayer wall, resource downloads, facility booking, etc.

---

# 9. Non-Functional Requirements

*   **Security**:
    *   Strong password storage and session handling.
    *   Strict tenant isolation.
    *   Proper auth checks on every API.
*   **Performance**:
    *   Pagination on lists (posts, events, messages, donations).
    *   Query optimization.
*   **Auditability**:
    *   AuditLog for critical actions (membership changes, impersonation, donation config changes).
*   **Accessibility**:
    *   Keyboard-friendly navigation.
    *   ARIA and semantic HTML.
    *   High-contrast color options.

---

# 10. Email & Notification System

This section details the platform's email strategy for communication and notifications, supplementing the in-app notification system.

### 10.1 Strategy & Provider

*   **Service Abstraction:** All email functionality will be routed through a dedicated `emailService` (`/services/emailService.ts` in the backend plan). This allows for swapping providers without changing business logic.
*   **Provider:** For development and initial deployment, **Gmail's SMTP server** will be used via a library like `Nodemailer`. This is cost-effective but has sending limits. For production scaling, the `emailService` will be configured to use a transactional email provider like **SendGrid**, **Mailgun**, or **Amazon SES** to ensure high deliverability.
*   **Execution Model:** Initially, emails will be sent synchronously within the API request lifecycle. The system will be designed with a future migration to a background job queue (e.g., BullMQ with Redis) in mind to handle bulk sending and prevent API timeouts.

### 10.2 Email Triggers & Templates

The platform will send emails for the following events:

1.  **Authentication & Account Management:**
    *   **Welcome Email:** Sent to a new user upon successful registration.
    *   **Password Reset:** An email containing a secure, time-sensitive link to the password reset page.

2.  **User-Driven Notifications (Opt-in):**
    *   Based on user preferences in their Account Settings:
        *   Notification of a new direct message.
        *   Notification of a new announcement in a joined tenant.
        *   Alerts when a membership request is approved or rejected.

3.  **Administrative & Moderation:**
    *   **Contact Form Responses:** When a tenant administrator responds to a message from the "Contact Submissions" panel, the response will be emailed directly to the address provided in the form. The email will be clearly marked as coming from the specific tenant (e.g., `Subject: Re: Your inquiry to [Temple Name]`).

4.  **Bulk Communication:**
    *   **Congregation Announcements:** When a user with the appropriate permissions (`canPostInAnnouncementChannels`) creates a new "Announcement" type post, they will be given an option to "Email this announcement to all members."
    *   If selected, the system will queue a job to send a formatted email containing the announcement's title and body to every approved member of the tenant who has not opted out of these communications.

### 10.3 Template Management

*   **Location:** All HTML email templates will be stored in a `/templates/email` directory.
*   **Technology:** A simple templating engine like EJS or Handlebars will be used to inject dynamic content (user names, tenant names, content bodies) into the templates.
*   **Requirements:**
    *   All emails must be **responsive** and render correctly on both desktop and mobile clients.
    *   Each email must include a **plain text version** for accessibility and for clients that do not render HTML.
    *   All non-essential emails (like announcements and notifications) must contain a clear **"Unsubscribe" or "Manage Notification Settings" link** that directs the user to their account settings page.

---

# 11. Future Roadmap Features

This section provides a high-level overview of features planned for development after the core product is complete, aimed at enhancing community engagement and administrative power.

### 11.1 Deeper Community Engagement

*   **Small Groups / Ministries:** A dedicated area for managing small groups like bible studies or volunteer teams. Each group will have its own page, leader info, schedule, and private member list, fostering closer-knit communities within a tenant.
*   **Volunteer Management:** A system for tenants to post volunteer opportunities (e.g., "3 greeters for Sunday service") and for members to sign up for specific roles or time slots, complete with automated reminders.
*   **Prayer Wall / Community Needs Board:** A moderated space for members to post prayer requests or tangible needs, with options for anonymous posting and for others to respond, fostering a supportive environment.

### 11.2 Enhanced Content & Media Experience

*   **Live Streaming Integration:** Tenants will be able to embed their live stream player (from YouTube, Facebook Live, etc.) onto a dedicated page, with a "We're Live!" indicator on the homepage and an integrated chat for online viewers.
*   **Resource Center (Downloads):** A central repository for tenants to upload and share documents like sermon notes, study guides (PDFs), or audio files, with options for member-only access.

### 11.3 Advanced Administrative Tools (Long-Term)

*   **Facility & Room Booking:** An internal calendar system for booking rooms and resources within the physical temple, with a request/approval workflow to prevent conflicts.
*   **Children's Ministry Check-in:** A secure system for parents to check children into classes, including security tag generation, attendance tracking, and parent communication tools. This is a highly specialized, long-term goal.
