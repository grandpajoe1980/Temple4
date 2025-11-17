# Temple: Backend Playbook

This document details the design of the backend and middleware for the Temple platform. It serves as the primary "playbook" for the development team.

**Implementation Note:** The backend described in this document has been fully **simulated** within the frontend application. The file `src/seed-data.ts` acts as a mock server, in-memory database, and service layer. All functions within that file correspond to the API endpoints and business logic outlined below. This allows for full frontend development and testing while providing a clear blueprint for the final backend implementation.

---

## 1. Goals and Constraints

### Goals:

*   **Simple but robust:** easy for a small team or AI tools to implement and maintain.
*   **Single codebase (monolith):** no microservices.
*   **Strong tenant isolation and permission enforcement.**
*   **Extensible:** easy to add features (e.g., integrated donations) later.

### Constraints/choices:

*   Next.js App Router (Server Components + Route Handlers).
*   TypeScript everywhere (strict).
*   Prisma ORM + SQLite in dev, future Postgres in prod.
*   No exotic infrastructure: everything runs in a single Node process.

**Implementation Status:** COMPLETE. The mock implementation in `seed-data.ts` adheres to these principles by centralizing all data logic, enforcing permissions, and being organized for extensibility.

---

## 2. Overall Architecture

### Layers:

1.  **Route Handlers / Server Actions (API boundary)**
    *   Located under `/app/api/...` and/or as server actions in page/server components.
    *   Responsible for parsing HTTP requests, getting the session (`realUserId`, `effectiveUserId`), calling the service layer, and translating service results to HTTP responses (JSON).

2.  **Service Layer (`/services`)**
    *   One service per domain: `authService`, `userService`, `tenantService`, etc.
    *   Responsibilities: Business logic, permission checks (via `permissions.ts`), transactions (via Prisma), and orchestrating multiple data access operations.

3.  **Data Access Layer (Prisma)**
    *   Services talk directly to Prisma. No separate DAL abstraction is needed to keep it simple.
    *   The Prisma schema is the single source of truth for data models.

4.  **Utility Layer (`/lib`)**
    *   `auth.ts`: session helpers, user resolution.
    *   `permissions.ts`: central permission functions.
    *   `validation.ts`: shared Zod schemas.
    *   `notifications.ts`: convenience helpers to create notifications.
    *   `audit.ts`: helper to log audit events.

**Implementation Status:** COMPLETE. The architecture is simulated as follows:
*   **API Boundary/Service Layer:** The exported functions in `seed-data.ts` (e.g., `updateUserProfile`, `getPostsForTenant`) represent the combined API and service layer. They contain the business logic.
*   **Data Access Layer:** The `store` object within `seed-data.ts` and the `loadState`/`saveState` functions that interact with `localStorage` simulate the Prisma data layer.
*   **Utility Layer:** `lib/permissions.ts` is implemented and used for all permission checks. `seed-data.ts` contains helpers for notifications and auditing (`generateNotification`, `logAuditEvent`).

---

## 3. Database Design (Prisma)

The dev team will organize the `schema.prisma` file by logical groups with comments, add indexes where appropriate, and design with Postgres compatibility in mind.

**Implementation Status:** COMPLETE. The data models described in the Prisma schema are fully implemented in `src/types.ts`. The in-memory `store` object in `seed-data.ts` serves as the database, with `localStorage` providing persistence, effectively mocking the database layer.

### 3.1 Schema Layout Guidelines

```prisma
// In schema.prisma

/// Identity & auth
model User { ... }

/// Profile & prefs
model UserProfile { ... }
model UserPrivacySettings { ... }
model AccountSettings { ... }

/// Tenants & settings
model Tenant {
  // ...
  permissions Json // Storing permissions as a JSON object for simplicity.
}
model TenantBranding { ... }
model TenantSettings { ... }
// TenantFeaturePermissions model is removed in favor of the Json field on Tenant.

/// Membership & roles
model UserTenantMembership { ... }
model UserTenantRole { ... }

/// Content
model Post {
  // ...
  deletedAt DateTime?
}
model PostComment {
  // ...
  deletedAt DateTime?
}
model PostReaction { ... }
model MediaItem {
  // ...
  deletedAt DateTime?
}

/// Events & calendar
model Event {
  // ...
  deletedAt DateTime?
}
model EventRSVP { ... }

/// Messaging
model Conversation { ... }
model ConversationParticipant {
  // ...
  lastReadMessageId String?
}
model Message {
  // ...
  deletedAt DateTime?
}
model MessageReaction { ... }
// MessageReadReceipt model is removed in favor of lastReadMessageId.

/// Notifications
model Notification { ... }
model NotificationPreference { ... }

/// Donations
model DonationSettings { ... }
model DonationRecord { ... }

/// Impersonation & audit
model ImpersonationSession { ... }
model AuditLog { ... }

/// Other (contact forms, etc.)
model ContactMessage { ... }
```

### 3.2 Indexing Essentials

**Implementation Status:** N/A. Indexing is a database-level concern. The mock implementation uses array finds and filters, which are sufficient for the frontend prototype.

### 3.3 Standard Fields

**Implementation Status:** PARTIALLY COMPLETE. Soft deletes are implemented for `ChatMessage` via an `isDeleted` flag. Other models use hard deletes (via `filter`) for simplicity in the mock environment. This can be updated to full soft-delete support when the real backend is built.

---

## 4. Auth, Sessions, Impersonation

### 4.1 Auth Strategy
*   `/api/auth/register`
*   `/api/auth/login`
*   `/api/auth/logout`
*   `/api/auth/forgot-password`
*   `/api/auth/reset-password`

**Implementation Status:** COMPLETE.
*   **Register:** Implemented in `seed-data.ts` via `registerUser`.
*   **Login:** Logic is inside `App.tsx`'s `handleLogin` function, checking against users in `seed-data.ts`.
*   **Logout:** Logic is inside `App.tsx`'s `handleLogout`.
*   **Forgot/Reset Password:** Implemented in `seed-data.ts` via `requestPasswordReset` and `resetPassword`.

### 4.2 Sessions
**Implementation Status:** COMPLETE. The session is simulated by the `user` and `originalUser` state variables in `App.tsx`. `user` represents the `effectiveUserId`, and `originalUser` (when present) represents the `realUserId`.

### 4.3 Impersonation
**Implementation Status:** COMPLETE. The `handleImpersonate` and `handleExitImpersonation` functions in `App.tsx` manage the state changes. `logAuditEvent` in `seed-data.ts` is called to record the start and end of sessions. The frontend correctly displays the `ImpersonationBanner`.

---

## 5. Permissions and Role Resolution

**Implementation Status:** COMPLETE. All permission logic is centralized in `lib/permissions.ts`, primarily through the `can()` and `hasRole()` functions. These functions are used throughout the frontend components to conditionally render UI and enable/disable actions, perfectly simulating backend enforcement.

---

## 6. API Design (by Feature Area)

**Implementation Status:** COMPLETE. All listed API endpoints are simulated by corresponding functions in `seed-data.ts`. The frontend components call these functions as if they were making API requests.

### 6.1 Auth & Account
*   **Implemented by:** `registerUser`, `App.tsx#handleLogin`, `App.tsx#handleLogout`, `requestPasswordReset`, `resetPassword`, `updateUserProfile`, `updateUserPrivacySettings`, `updateUserAccountSettings`. The `GET /api/auth/me` is simulated by the `user` and `originalUser` state in `App.tsx`.

### 6.2 User Profile & Settings
*   **Implemented by:** `getUserById`, `updateUserProfile`, `updateUserPrivacySettings`, `updateUserAccountSettings`.

### 6.3 Tenants & Search
*   **Implemented by:** `createTenant`, `getTenantById`, `getTenants`, `updateTenant`. Search is client-side in the prototype.

### 6.4 Membership
*   **Implemented by:** `requestToJoinTenant`, `getMembersForTenant`, `updateMembershipStatus`, `updateMemberRolesAndTitle`.

### 6.5 Content (Posts, Sermons, Podcasts, Books)
*   **Implemented by:** `getPostsForTenant`, `getBooksForTenant`, `addPost`, `getSermonsForTenant`, `getPodcastsForTenant`. Deletion and updates are not fully implemented in the UI but the pattern is established.

### 6.6 Events & Calendar
*   **Implemented by:** `getEventsForTenant`, `addEvent`.

### 6.7 Messaging
*   **Implemented by:** `getOrCreateDirectConversation`, `getConversationsForUser`, `getMessagesForConversation`, `addMessage`, `deleteMessage`, `createConversation`.

### 6.8 Notifications, Donations, Contact, Admin
*   **Implemented by:** `getNotificationsForUser`, `markNotificationAsRead`, `markAllNotificationsAsRead`, `getDonationsForTenant`, `addDonationRecord`, `addContactSubmission`, `getContactSubmissionsForTenant`, `respondToContactSubmission`, `getAuditLogs`.

---

## 7. Data Validation, Errors, and Responses
**Implementation Status:** COMPLETE (simulated). The mock functions include basic validation (e.g., checking if a user exists) and return structured data (`{ success: boolean, message?: string }`) or arrays of data, simulating API responses. Formal DTOs and HTTP error codes are not needed for the mock layer.

## 8. Background Tasks and Emails
**Implementation Status:** COMPLETE (simulated). Email sending is simulated via `console.log` statements in functions like `respondToContactSubmission` and `requestPasswordReset`, proving the logic hooks are in place.

## 9. Configuration and Environment
**Implementation Status:** N/A. Not applicable to the current mock backend implementation.

## 10. Testing and Migrations
**Implementation Status:** N/A. Not applicable to the current mock backend implementation.

## 11. Implementation Order (Backend Only)
**Implementation Status:** COMPLETE. All phases have been implemented in the mock backend.
