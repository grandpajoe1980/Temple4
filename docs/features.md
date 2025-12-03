
# Temple4 Feature Expansion Plan

## 0. Conventions for All New Work

### Architecture (Current Implementation)

* **Three-Layer Pattern:**
  * API Routes: `app/api/[domain]/.../route.ts` (Route Handler - NO business logic)
  * Business Logic: `lib/data.ts` (Currently combined data + service layer - 60+ functions)
  * Data Access: Prisma queries via `lib/db.ts`


* **Client/Server Boundaries:**
  * ✅ Server Components: Fetch data via `lib/data.ts`, pass as props
  * ❌ Client Components: NEVER call async Prisma functions directly
  * 🔧 Currently fixing 116 TypeScript errors related to this pattern

* **File Structure:**
  * Data Layer: `prisma/schema.prisma` as source of truth, `types.ts` in sync
  * UI Pages: `app/tenants/[tenantId]/...` (tenant-scoped routes)
  * Shared Components: `app/components/*` and `components/ui/*` (shadcn/ui)

### Multi-Tenancy (Strictly Enforced)

* **Database:**
  * Every new table MUST have `tenantId` field (String, not Int)
  * All queries MUST filter by `tenantId` + membership/role
  * Only super-admins (`user.isSuperAdmin = true`) can bypass tenant scoping
  * Use `assertHasTenantAccess()` from `lib/tenant-isolation.ts` for validation

* **Existing Models:** 23 tenant-scoped models already implemented

### Permissions System (Established Pattern)

* **Permission Checks:**
  * Use `can(user, tenant, permission)` from `lib/permissions.ts`
  * 19 existing permissions in `RolePermissions` interface
  * 5 roles: MEMBER, STAFF, CLERGY, MODERATOR, ADMIN
  * Tenant.permissions stored as JSON (`TenantFeaturePermissions`)

* **Feature Toggles:**
  * All toggles in `TenantSettings` model (15 existing: enableCalendar, enablePosts, etc.)
  * New features MUST add corresponding boolean field to `TenantSettings`

* **Data Access Helpers:**
  * `getMembershipForUserInTenant(userId, tenantId)` - from `lib/data.ts`
  * `can(user, tenant, 'permission')` - from `lib/permissions.ts`

### Testing (Mature Infrastructure)

* **Test Suite:** `test-suite/` directory with 16 files
  * `api-tests.ts` - 95+ API endpoint tests
  * `page-tests.ts` - 30+ page loading tests
  * `feature-tests.ts` - 15+ workflow tests
  * `permission-tests.ts` - Authorization checks

* **Running Tests:**
  * `npm run test:all` - Full suite
  * `npm run test:api` - API only
  * `npm run test:pages` - Pages only
  * `npm run test:features` - Features only

* **Test Pattern:**
  ```typescript
  await this.testEndpoint('Category', 'Description', async () => {
    const response = await fetch(url);
    return { response, expectedStatus: [200, 404] };
  });
  ```

* **For Each Feature:** Add tests to existing files, ensure tenant isolation, verify permissions

### Soft Delete Pattern (Inconsistent - Needs Standardization)

* **Current Mix:**
  * Posts, Events, MediaItems: `deletedAt?: DateTime`
  * Books, Podcasts: `isDeleted: Boolean`
  * ChatMessage: `deletedAt?: DateTime`
  * Some models: Hard delete only

* **Recommendation:** Standardize on `deletedAt?: DateTime` for new features

### Audit Logging (Established)

* **Current:** `AuditLog` model with 14 `ActionType` values
* **Pattern:** Call `logAuditEvent()` from `lib/data.ts` for sensitive actions
* **For New Features:** Add new ActionType enum values as needed

---

## Phasing Strategy (Reordered for Dependencies)

**Current Status:** Phase A-E complete (foundation, auth, multi-tenancy, core features)

**Phase F+** implementation order ensures all prerequisites are met:

* **Phase F:** Foundation & Infrastructure (TypeScript fixes, file uploads, email service)
* **Phase G:** Content Enhancements (social links, tabs, gallery, comments)
* **Phase H:** Pastoral Care & Engagement (prayer requests 2.0, visitor follow-up, small groups)
* **Phase I:** Volunteer & Service Operations (rotas, service planning, facilities)
* **Phase J:** Events Enhancement (registration, capacity, check-in, multi-channel)
* **Phase K:** Donations & Finance (funds, pledges, statements)
* **Phase L:** Content & Education (courses, resource library enhancements, sermon series)
* **Phase M:** Multi-language & Accessibility
* **Phase N:** Analytics & Admin Power Tools (depends on all prior event logging)

---

## PHASE F: Foundation & Infrastructure (CRITICAL - Do First)

**Goal:** Fix blocking technical debt and establish missing services required by all future phases.

**Prerequisites:** None - this IS the prerequisite phase.

### F1: TypeScript Error Resolution (Sprint F1 - Week 1)

#### Goals
* Fix all 116 remaining TypeScript errors (client/server boundary issues)
* Establish clean client/server component patterns
* Enable test suite to run again

#### Current Issues
* Client components with hooks calling async `lib/data.ts` functions
* Type mismatches between Prisma types and component props
* Implicit `any` types in 15+ locations

#### Work Items
1. **TenantLayout** (~15 errors) - User type incompatibility, async notifications
2. **ResourceCenterPage** (~10 errors) - Async calls in useMemo
3. **GroupChatPage** - Promise handling
4. **ProfilePage** - Type mismatches
5. **Remaining components** - Various async/await issues

#### Pattern to Apply
```typescript
// ✅ CORRECT: Server Component (page.tsx)
export default async function EventsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const events = await getEventsForTenant(tenantId); // lib/data.ts
  return <EventsList events={events} />; // Pass as props
}

// ✅ CORRECT: Client Component
'use client';
export function EventsList({ events }: { events: EnrichedEvent[] }) {
  const [filtered, setFiltered] = useState(events); // Local state OK
  // No async data fetching here
}
```

#### Success Criteria
* ✅ Zero TypeScript errors
* ✅ All tests can run
* ✅ Pattern documented in DEVELOPER-GUIDE.md

#### Tests
* Verify build completes: `npm run build`
* Run full test suite: `npm run test:all`

---

### F2: File Upload Service (Sprint F1 - Week 2)

#### Goals
* Implement actual file upload/storage (currently URLs are just strings)
* Support Photo Gallery, Resource Library, future media features

#### Current State
* `MediaItem` model exists with `url: String` field
* `ResourceItem` model has `urlOrPath: String` field
* No actual upload mechanism - URLs are placeholders

#### Implementation Options
1. **Local Storage** (dev/small deployments): Write to `public/uploads/[tenantId]/`
2. **Cloud Storage** (production): AWS S3, Cloudflare R2, or Vercel Blob
3. **Abstraction Layer:** Service that can switch between storage backends

#### Data Model Changes
```prisma
// Add to existing MediaItem model:
model MediaItem {
  // ... existing fields ...
  storageKey String?     // e.g., "tenants/abc123/media/xyz.jpg"
  mimeType   String?     // e.g., "image/jpeg"
  fileSize   Int?        // bytes
  uploadedAt DateTime @default(now())
}
```

#### New Service
* `lib/storage.ts`:
  * `uploadFile(tenantId, file, category)` → returns `{ url, storageKey }`
  * `deleteFile(storageKey)` → boolean
  * `getSignedUrl(storageKey, expiresIn)` → temporary URL for private files

#### API Routes
* `POST /api/upload` - Accepts multipart/form-data, validates file type/size, returns URL
* `DELETE /api/upload/[key]` - Removes file (admin only)

#### Permissions
* Upload permission per file type (photos, resources, avatars)
* Tenant storage quota enforcement (add `TenantSettings.maxStorageMB`)

#### Tests
* Upload image → URL returned, file accessible
* Upload with wrong tenant → 403
* Delete file → no longer accessible
* Quota enforcement

#### Success Criteria
* ✅ Files actually stored and retrievable
* ✅ Photo Gallery can use real uploads
* ✅ Resource Center can upload PDFs

---

### F3: Email Service Integration (Sprint F2)

#### Goals
* Enable actual email sending (password resets, notifications, campaigns)
* Pluggable provider architecture (Resend, SendGrid, etc.)

#### Current State
* `PasswordResetToken` model exists but no emails sent
* `Notification` model exists but only in-app
* Email campaigns planned but no infrastructure

#### Implementation
* **Provider Choice:** Resend (simple, good DX) or SendGrid (enterprise)
* **Service:** `lib/email.ts`
  * `sendEmail({ to, subject, html, text })` - Low-level
  * `sendPasswordReset(user, token)` - Template helper
  * `sendNotificationEmail(notification)` - Template helper
  * `sendBulkEmail(campaign)` - Batch sending

#### Configuration
* Environment variables: `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`
* Per-tenant: `TenantSettings.emailFromAddress`, `emailFromName`

#### Templates
* Create `lib/email-templates/` directory:
  * `password-reset.tsx` (React Email or plain HTML)
  * `notification.tsx`
  * `campaign.tsx`
  * `welcome.tsx`

#### Data Model (New)
```prisma
model EmailLog {
  id           String   @id @default(cuid())
  tenantId     String?
  recipient    String
  subject      String
  status       String   // SENT, FAILED, BOUNCED
  provider     String   // RESEND, SENDGRID
  providerId   String?  // External tracking ID
  sentAt       DateTime @default(now())
  error        String?
}
```

#### Tests
* Send password reset email (mock in tests)
* Email log created
* Failed send logged

#### Success Criteria
* ✅ Password resets send actual emails
* ✅ Infrastructure ready for Phase G campaigns
* ✅ Email logs for debugging

---

### F4: Search Infrastructure (Sprint F2)

#### Goals
* Add full-text search for posts, events, sermons, resources
* Foundation for Phase L (multi-language search)

#### Current State
* No search functionality
* `/explore` page has client-side filtering only

#### Implementation Options
1. **Prisma Full-Text Search** (SQLite limitations, Postgres better)
2. **Simple SQL LIKE queries** (good enough for MVP)
3. **External Service** (Algolia, Typesense - future)

#### New Service
* `lib/search.ts`:
  * `searchTenantContent(tenantId, query, filters)` - Returns mixed content types
  * `searchUsers(tenantId, query)` - Member directory search
  * `searchResources(tenantId, query, tags)` - Resource library

#### API Routes
* `GET /api/tenants/[tenantId]/search?q=query&type=posts,events`

#### UI Components
* `<SearchBar />` - Reusable component
* `<SearchResults />` - Displays mixed results with type indicators

#### Tests
* Search finds posts by title/body
* Search respects visibility
* Search scoped to tenant

#### Success Criteria
* ✅ Global search bar in tenant nav
* ✅ Fast enough for real-time suggestions
* ✅ Foundation for advanced filters

---

## PHASE G: Content Enhancements

**Prerequisites:** Phase F complete (file uploads, TypeScript fixes)

### G1: Social Links on Contact/Footer (Sprint G1 - Week 1)

#### Goals
* Display tenant social media links (Facebook, Instagram, Twitter/X, YouTube) on contact page and footer

#### Data Model Changes
```prisma
// Extend existing TenantBranding model:
model TenantBranding {
  // ... existing fields (logoUrl, bannerImageUrl, primaryColor, accentColor, customLinks) ...
  facebookUrl   String?
  instagramUrl  String?
  twitterUrl    String?
  youtubeUrl    String?
  websiteUrl    String?  // Official website
  linkedInUrl   String?
}
```

#### Implementation
* Add fields to Prisma schema, run migration
* Update `lib/data.ts`: `updateTenantBranding()` to include new fields
* Extend API: `PATCH /api/tenants/[tenantId]/branding`

#### UI Updates
* **Contact Page** (`app/tenants/[tenantId]/contact/page.tsx`):
  * Display social icons below contact form
  * Use react-icons: FaFacebook, FaInstagram, FaTwitter, FaYoutube
* **Footer** (add to tenant layout):
  * Small social icon bar if any URLs present

#### Permissions
* Edit: `ADMIN` role only (via tenant control panel)
* View: Public (no auth required)

#### Tests
* API: Update branding with social URLs
* Page: Contact page renders icons only when URLs exist
* Validation: Invalid URL format rejected

#### Success Criteria
* ✅ Tenant admins can add social links
* ✅ Links visible on contact page
* ✅ Icons only render when URLs present

---

### G2: Navigation Tabs Customization (Sprint G1 - Week 2)

#### Goals
* Let tenants customize which navigation tabs appear, their order, and labels
* Enable/disable pages without code changes

#### Current State
* Nav hardcoded in tenant layout
* Feature toggles in `TenantSettings` (enablePosts, enableSermons, etc.) partially control visibility

#### Data Model Changes
```prisma
model TenantSettings {
  // ... existing fields ...
  navConfig  Json?  // Array<{ key: string, visible: boolean, label?: string, order: number }>
}
```

#### navConfig Structure
```typescript
type NavConfigItem = {
  key: 'home' | 'posts' | 'events' | 'sermons' | 'podcasts' | 'books' | 
       'gallery' | 'resources' | 'prayer-wall' | 'small-groups' | 
       'volunteer' | 'giving' | 'contact';
  visible: boolean;
  label?: string;      // Custom label override (default uses key)
  order: number;       // 0-based display order
  icon?: string;       // Optional icon name
};
```

#### Implementation
* New functions in `lib/data.ts`:
  * `getNavConfig(tenantId)` - Returns ordered array of visible tabs
  * `updateNavConfig(tenantId, config)` - Validates against allowed keys
* API: `GET/PATCH /api/tenants/[tenantId]/nav-config`
* Validation: Ensure at least 'home' always visible, limit to existing features

#### UI Components
* **Tenant Layout Update** (`app/tenants/[tenantId]/layout.tsx`):
  * Fetch navConfig in server component
  * Render nav tabs dynamically based on config
  * Respect both feature toggles AND navConfig visibility
* **Admin Control Panel** (`app/tenants/[tenantId]/admin/navigation`):
  * Drag-and-drop reordering (use dnd-kit)
  * Toggle visibility checkboxes
  * Text input for custom labels
  * Reset to defaults button

#### Permissions
* Edit navConfig: `ADMIN` role only
* View custom nav: All users (respects feature toggles + membership)

#### Tests
* API: Update navConfig with valid/invalid keys
* Logic: Hidden tabs return 404 when accessed directly
* UI: Nav bar reflects customization
* Feature: Toggle gallery off → tab disappears and /gallery route blocked

#### Success Criteria
* ✅ Admins can reorder tabs
* ✅ Custom labels display correctly
* ✅ Hidden pages return proper 404/403

---

### G3: Photo Gallery (Sprint G2)

#### Goals
* Per-tenant photo albums for events, community, facilities
* Simple browsing with categorization

#### Prerequisites
* ✅ Phase F2 file upload service (REQUIRED)

#### Data Model (New Tables)
```prisma
enum AlbumVisibility {
  PUBLIC
  MEMBERS
  PRIVATE
}

model MediaAlbum {
  id             String           @id @default(cuid())
  tenantId       String
  tenant         Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title          String
  description    String?
  coverPhotoId   String?
  coverPhoto     MediaPhoto?      @relation("AlbumCover", fields: [coverPhotoId], references: [id])
  visibility     AlbumVisibility  @default(MEMBERS)
  createdById    String
  createdBy      User             @relation(fields: [createdById], references: [id])
  photos         MediaPhoto[]     @relation("AlbumPhotos")
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  deletedAt      DateTime?
  
  @@index([tenantId, deletedAt])
}

model MediaPhoto {
  id              String      @id @default(cuid())
  tenantId        String
  tenant          Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  albumId         String
  album           MediaAlbum  @relation("AlbumPhotos", fields: [albumId], references: [id], onDelete: Cascade)
  url             String      // From storage service
  storageKey      String      // For deletion
  caption         String?
  takenAt         DateTime?
  uploadedById    String
  uploadedBy      User        @relation(fields: [uploadedById], references: [id])
  tags            String?     // JSON array or comma-separated
  order           Int         @default(0)  // For manual sorting
  createdAt       DateTime    @default(now())
  
  albumCovers     MediaAlbum[] @relation("AlbumCover")
  
  @@index([tenantId, albumId])
  @@index([tenantId, uploadedById])
}
```

#### Implementation
* Add to `lib/data.ts`:
  * `getAlbumsForTenant(tenantId, userId?)` - Respects visibility
  * `getAlbumById(albumId, userId?)` - With photos, visibility check
  * `createAlbum(tenantId, creatorId, data)`
  * `addPhotoToAlbum(albumId, photoData)` - Uses storage service
  * `deletePhoto(photoId)` - Soft delete + remove from storage
  * `updateAlbumVisibility(albumId, visibility)`

* API Routes:
  * `GET /api/tenants/[tenantId]/albums` - List albums
  * `POST /api/tenants/[tenantId]/albums` - Create album
  * `GET /api/tenants/[tenantId]/albums/[albumId]` - Album detail with photos
  * `PATCH /api/tenants/[tenantId]/albums/[albumId]` - Update album
  * `DELETE /api/tenants/[tenantId]/albums/[albumId]` - Soft delete
  * `POST /api/tenants/[tenantId]/albums/[albumId]/photos` - Upload photo
  * `DELETE /api/tenants/[tenantId]/albums/[albumId]/photos/[photoId]`

#### UI Pages
* **Gallery Index** (`app/tenants/[tenantId]/gallery/page.tsx`):
  * Grid of albums with cover images
  * Filter by date, creator
  * "Create Album" button (ADMIN/STAFF only)
* **Album Detail** (`app/tenants/[tenantId]/gallery/[albumId]/page.tsx`):
  * Photo grid (Masonry or standard grid)
  * Lightbox viewer (use yet-another-react-lightbox)
  * Upload photos button (permission-based)
  * Edit album button (creator or ADMIN)
* **Admin Settings** (in tenant control panel):
  * Toggle `enableGallery` in TenantSettings
  * Set default visibility
  * Allow member uploads setting

#### Permissions
* **Feature Toggle:** Add `enableGallery: Boolean @default(false)` to TenantSettings
* **New Permission:** Add `canManageGallery: boolean` to RolePermissions
* **Album Creation:** ADMIN + STAFF (or anyone if `galleryMemberUploadAllowed`)
* **Photo Upload:** Album creator + ADMIN + STAFF
* **View:** Depends on album visibility (PUBLIC, MEMBERS, PRIVATE)

#### Tests
* API: CRUD albums and photos, tenant isolation
* Visibility: Public album visible to non-members, MEMBERS album requires login
* Upload: File actually stored via storage service
* Deletion: Photo removed from storage when deleted
* Feature toggle: Gallery disabled → routes return 404

#### Success Criteria
* ✅ Admins can create albums and upload photos
* ✅ Members can view albums per visibility
* ✅ Lightbox viewer works smoothly
* ✅ Photos stored via Phase F2 storage service

---

### G4: Comments on Posts (Sprint G3)

#### Goals
* Threaded comments on posts with moderation
* Per-tenant enable/disable

#### Current State
* `TenantSettings.enableComments` exists but no comment model/functionality

#### Data Model (New Table)
```prisma
enum CommentStatus {
  PUBLISHED
  HIDDEN
  FLAGGED
  DELETED
}

model PostComment {
  id              String         @id @default(cuid())
  tenantId        String
  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  postId          String
  post            Post           @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId        String
  author          User           @relation(fields: [authorId], references: [id])
  parentCommentId String?
  parentComment   PostComment?   @relation("CommentReplies", fields: [parentCommentId], references: [id])
  replies         PostComment[]  @relation("CommentReplies")
  body            String
  status          CommentStatus  @default(PUBLISHED)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  deletedAt       DateTime?
  
  @@index([tenantId, postId, status])
  @@index([authorId])
}
```

#### Implementation
* Add to `lib/data.ts`:
  * `getCommentsForPost(postId, userId?)` - Returns tree structure, respects status
  * `createComment(tenantId, postId, authorId, body, parentCommentId?)`
  * `updateComment(commentId, body)`
  * `moderateComment(commentId, status)` - Set HIDDEN/FLAGGED
  * `deleteComment(commentId)` - Soft delete

* API Routes:
  * `GET /api/posts/[postId]/comments` - Tree of comments
  * `POST /api/posts/[postId]/comments` - Create comment
  * `PATCH /api/comments/[commentId]` - Edit own comment (15min window)
  * `DELETE /api/comments/[commentId]` - Delete own or moderate
  * `POST /api/comments/[commentId]/moderate` - Change status (moderator only)

#### UI Components
* **Comment Thread** (add to post detail page):
  * Recursive comment display with indentation (max depth 3)
  * Reply button on each comment
  * Simple textarea for new comments (members only)
  * Moderation controls (ADMIN/MODERATOR only): Hide, Flag, Delete buttons
* **Admin Moderation View** (`app/tenants/[tenantId]/admin/comments`):
  * List of recent comments with filters: All, Flagged, Hidden
  * Bulk moderation actions

#### Permissions
* **Create Comment:** Any APPROVED member of tenant
* **Edit Comment:** Own comments only, within 15 minutes
* **Delete Comment:** Own comments always, or ADMIN/MODERATOR for any
* **Moderate:** ADMIN + MODERATOR roles (can hide/flag/approve)
* **Feature Toggle:** `TenantSettings.enableComments` (already exists)

#### Tests
* API: Create comment, threaded reply, edit, delete, moderate
* Visibility: HIDDEN comments not visible to regular members
* Permission: Non-member cannot comment
* Feature toggle: Comments disabled → API returns 403

#### Success Criteria
* ✅ Members can comment on posts
* ✅ Threaded replies work (3 levels deep)
* ✅ Moderators can hide/flag comments
* ✅ Feature toggle enforced

---

## PHASE H: Pastoral Care & Engagement

**Prerequisites:** Phase G complete (comments for prayer requests)

### Goals

* Per-tenant photo gallery for events, community, facilities.
* Simple browsing with basic categorization.

### Data Model

* New table: `MediaAlbum` (tenant-scoped)

  * `id`, `tenantId`, `title`, `description`, `coverImageId`, `visibility` (`PUBLIC`/`MEMBERS`).
* New table: `MediaPhoto`

  * `id`, `tenantId`, `albumId`, `url` (or storage key), `caption`, `takenAt`, `uploadedByUserId`, `tags` (string array).

### API / Services

* `app/api/media/albums`:

  * `GET /tenants/[tenantId]/albums` – list albums (respect visibility).
  * `POST` – create album (admin/staff only by default).
* `app/api/media/photos`:

  * `GET /tenants/[tenantId]/albums/[albumId]/photos`
  * `POST` – upload/add photo metadata (upload mechanism can be stubbed for now).
  * `DELETE /[photoId]` – admin/staff only.

### UI

* Tenant gallery entrypoint: `/tenants/[tenantId]/gallery`

  * Album grid with cover image, title, photo count.
* Album detail: `/tenants/[tenantId]/gallery/[albumId]`

  * Photo grid, lightbox viewer.
* Tenant admin:

  * Gallery settings in tenant control panel: “Enable Photo Gallery”, default visibility, who may create albums.

### Permissions

* Feature toggle in `TenantSettings`: `galleryEnabled`, `galleryMemberUploadAllowed`.
* Default:

  * Album management: `ADMIN` + `STAFF`.
  * View: `PUBLIC` or `MEMBERS` per album.

### Tests

* API: CRUD album, CRUD photos, tenant isolation.
* Pages: gallery & album pages load and respect visibility.
* Feature tests: admin can create album and upload photos; member sees photos as expected.

---

## 2. Metrics / Analytics (Phase M – Sprints M1–M2)

### Goals

* Per-tenant dashboards for engagement, attendance, giving, groups.
* Global admin overview for platform health.

### Data Model

* Prefer **event logging** rather than pre-aggregated tables:

  * New table: `AnalyticsEvent`

    * `id`, `tenantId`, `userId?`, `type` (e.g., `POST_VIEW`, `EVENT_RSVP`, `DONATION_CREATED`, `GROUP_ATTENDANCE`), `entityType`, `entityId`, `occurredAt`, `metadata` (JSON).
* Use queries + materialized views (or cached calculations) at the service layer.

### API / Services

* `lib/services/analytics.ts`

  * `recordEvent({ tenantId, userId?, type, entityType, entityId, metadata })`
  * Aggregation functions:

    * `getTenantMetrics(tenantId, range)` – high-level metrics.
    * `getGroupMetrics(tenantId, groupId, range)`.
* `app/api/analytics/tenant/[tenantId]`:

  * `GET` – return summarized metrics for dashboards.

### UI

* Tenant admin dashboard tab “Analytics”:

  * Cards: active members, event attendance, giving totals (if donations enabled), content views.
  * Filters: date range, category.
* Global super admin dashboard:

  * Top tenants by activity, errors, growth.

### Permissions

* Tenant metrics visible to `ADMIN` and optionally `STAFF`.
* Global metrics visible only to platform super admin.

### Tests

* Ensure events record correctly when:

  * Viewing posts, RSVPing, donating, attending groups, etc.
* API tests for `getTenantMetrics` with sample data.
* Page tests: analytics dashboards load; unauthorized users blocked.

---

## 3. Customization of Tabs (Phase F – Sprint F2)

### Goals

* Allow tenants to choose which tabs/pages appear in their navigation and ordering.
* Enable / disable feature pages without code changes.

### Data Model

* Extend `TenantSettings`:

  * `navConfig` JSON:

    * Array of `{ key: 'posts'|'events'|'gallery'|... , visible: boolean, label?: string, order: number }`.

### API / Services

* `lib/services/tenant-settings.ts`:

  * `getNavConfig(tenantId)`
  * `updateNavConfig(tenantId, config)` with validation against a fixed registry of allowed tabs.
* API route: `app/api/tenants/[tenantId]/nav-config`.

### UI

* Tenant control panel: “Navigation & Tabs” section:

  * List of known tabs with toggles for visibility, drag-and-drop order, optional custom label.
* Tenant layout:

  * Top nav reads `navConfig` and renders only enabled tabs in specified order.

### Permissions

* Only `TENANT_ADMIN` can modify navConfig.

### Tests

* API tests: nav config CRUD, validation, tenant isolation.
* Page tests: nav bar reflects configuration; hidden tabs are not rendered or routable (403/404).
* Feature tests: toggling gallery off removes tab and denies direct access.

---

## 4. Comments on Posts (Phase F – Sprint F3)

### Goals

* Per-post threaded comments with moderation.
* Toggle per tenant.

### Data Model

* New table: `PostComment`

  * `id`, `tenantId`, `postId`, `authorUserId`, `parentCommentId?`, `body`, `createdAt`, `updatedAt`, `status` (`PUBLISHED`, `HIDDEN`, `FLAGGED`).

### API / Services

* `lib/services/comments.ts`

  * `getCommentsForPost(tenantId, postId)`
  * `createComment({ tenantId, postId, authorUserId, body, parentCommentId? })`
  * `moderateComment({ tenantId, commentId, status })`
* Routes: `app/api/posts/[postId]/comments`.

### UI

* Post detail page:

  * Comments thread under post.
  * Simple text area for adding a comment (members only).
* Tenant admin moderation view:

  * List of recent comments with status filter.

### Permissions

* Feature toggle: `commentsEnabled`.
* Create:

  * By default, any `MEMBER` of tenant.
* Moderate:

  * `ADMIN` + delegated moderators (role or explicit list).

### Tests

* API: create, list, moderate, tenant isolation.
* Pages: comments render; comment form visible only to members; moderation UI accessible to admins.
* Feature: member posts comment → visible; flagged/hidden comment no longer visible.

---

## 5. Email Handling – Mass Emails (Phase F – Sprint F4 + future sprints)

### Goals

* Allow tenant leaders to send announcements to members via email (within simple limits).
* Keep architecture ready for plugging in real email providers.

### Data Model

* New table: `EmailCampaign`

  * `id`, `tenantId`, `createdByUserId`, `subject`, `bodyHtml`, `audience` (`ALL_MEMBERS`, `ROLE:STAFF`, etc.), `status` (`DRAFT`, `QUEUED`, `SENT`, `FAILED`), `createdAt`, `sentAt?`.
* Optional: `EmailRecipientLog` for per-recipient status in later phases.

### API / Services

* Service: `lib/services/email-campaigns.ts`:

  * `createCampaign`, `updateCampaign`, `queueCampaign`, `listCampaigns`.
  * Stubbed `sendCampaign(campaignId)` that logs actions; later integrate provider.
* API: `app/api/email-campaigns`.

### UI

* Tenant admin: “Email / Announcements” tab:

  * List of campaigns, status.
  * Form: subject, rich-text body, audience selector, preview, send button.

### Permissions

* Only `ADMIN` / designated communication roles can create/send campaigns.
* Respect tenant setting: `emailCampaignsEnabled`.

### Tests

* API: create/queue campaigns, ensure scoped to tenant.
* Feature: sending campaign triggers job or stubbed sending; logs created.

---

## 6. Socials on Contact Us Page (Phase F – Sprint F1)

### Goals

* Show tenant’s social links (Facebook, Twitter/X, Instagram, YouTube, etc.) on contact and footer.

### Data Model

* Extend `TenantBranding` or `TenantSettings` with:

  * `facebookUrl`, `instagramUrl`, `twitterUrl`, `youtubeUrl`, `websiteUrl`, etc.

### API / Services

* Reuse tenant settings endpoints to update social links.

### UI

* Contact page: `/tenants/[tenantId]/contact`

  * Show address, map, contact form (if exists), and social icons.
* Footer: show social icons if URLs are set.

### Permissions

* Editable by `TENANT_ADMIN`.

### Tests

* Page tests: contact page renders with/without social links.
* Visual: icons only rendered when URLs exist; no broken links.

---

## 7. Services Offered (Funerals, Weddings, Banquets, Sunday School, etc.) (Phase F – Sprint F2)

### Goals

* Tenant can list services they offer (ceremonies, community services, classes).
* Optional detail pages and “request info” contact route.

### Data Model

* New table: `ServiceOffering`

  * `id`, `tenantId`, `name`, `description`, `category` (enum: `CEREMONY`, `EDUCATION`, `FACILITY`, etc.), `public` (bool), `contactEmailOverride?`, `requiresBooking` (bool).

### API / Services

* `lib/services/service-offerings.ts`: CRUD respecting tenant.

### UI

* `/tenants/[tenantId]/services`:

  * List of services, filter by category.
* Detail: `/tenants/[tenantId]/services/[serviceId]`.
* Optional: “Request info” button linking to contact form with pre-filled service.

### Permissions

* Manage services: `ADMIN`/`STAFF`.
* View public services: visitors.

### Tests

* API: CRUD service offerings, tenant isolation.
* Pages: list/detail rendering, permissions.

---

## 8. Facilities – Schedule & Checkout System (Phase J – Sprints J2–J3)

### Goals

* Let tenants define facilities (rooms, halls, equipment) and manage bookings.
* Prevent double-booking, integrate with events/services.

### Data Model

* New table: `Facility`

  * `id`, `tenantId`, `name`, `description`, `location`, `capacity`, `type` (`ROOM`, `HALL`, `EQUIPMENT`), `isActive`.
* New table: `FacilityBooking`

  * `id`, `tenantId`, `facilityId`, `eventId?`, `requestedByUserId`, `startAt`, `endAt`, `status` (`REQUESTED`, `APPROVED`, `REJECTED`, `CANCELLED`), `notes`.

### API / Services

* Service: `lib/services/facilities.ts`:

  * Facilities CRUD.
  * Booking request/approval workflows.
  * Double-booking checks.
* API routes: `/api/facilities`, `/api/facilities/[facilityId]/bookings`.

### UI

* `/tenants/[tenantId]/facilities`:

  * List of facilities with availability indicator.
* Booking UI:

  * From facility detail or from event creation (“Reserve facility” section).
* Admin view:

  * Calendar of bookings; approve/deny requests.

### Permissions

* Facility management + booking approval: `ADMIN`/facilities role.
* Member booking requests allowed if tenant setting enables it.

### Tests

* API: cannot approve overlapping bookings on same facility.
* Features: member requests booking; admin approves; booking visible on facilities and events calendar.

---

## PHASE H: Pastoral Care & Engagement (Already Added Above)

_See sections H1-H4 above for: Prayer Requests 2.0, Visitor Follow-up, Pastoral Care Tracker, Small Group Attendance_

---

## PHASE I: Volunteer & Service Operations

**Prerequisites:** Phase H complete (small group patterns)

## Continuation from Phase I

### I1: Enhanced Volunteer Scheduling / Rotas (Sprint I1)

#### Goals
* Assign volunteers to specific roles for events and services
* Accept/decline workflow
* Integration with existing `VolunteerNeed` model

#### Current State
* `VolunteerNeed` model exists
* `VolunteerSignup` model exists
* Basic volunteering enabled via `TenantSettings.enableVolunteering`

#### Data Model Enhancement
```prisma
// Extend existing models
model VolunteerNeed {
  // ... existing fields ...
  roleDescription  String?      // More detailed role info
  skillsRequired   String?      // JSON array of skills
  eventId          String?      // Link to specific event
  event            Event?       @relation(fields: [eventId], references: [id])
}

model VolunteerSignup {
  // ... existing fields ...
  assignedRole     String?      // Specific assignment within need
}

// New table for recurring roles
model VolunteerRole {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String   // e.g., "Greeter", "AV Tech", "Usher"
  description String?
  category    String?  // "Sunday Service", "Events", "Administration"
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  @@index([tenantId, isActive])
}
```

#### Implementation
* Extend `lib/data.ts`:
  * `getVolunteerRolesForTenant(tenantId)`
  * `createVolunteerRole(tenantId, data)`
  * `getVolunteerAssignmentsForUser(userId, tenantId)`
  * `getUpcomingVolunteerNeeds(tenantId)` - For dashboard

#### UI Enhancement
* **Events Detail Page**: Add "Volunteers Needed" section showing roles
* **Member Portal** (`app/account/volunteering`): "My Assignments" page
* **Admin** (`app/tenants/[tenantId]/admin/volunteers`): Roles management, scheduling grid

#### Tests
* Role CRUD operations
* Assignment workflow (signup → accept → decline)
* Event-volunteer linkage

---

### I2: Service Offerings Catalog (Sprint I2)

#### Goals
* List services offered (weddings, funerals, banquets, classes, facility rentals)
* Public-facing catalog with inquiry forms

#### Data Model (New Table)
```prisma
enum ServiceCategory {
  CEREMONY        // Weddings, Funerals, Baptisms
  EDUCATION       // Sunday School, Bible Study, Classes
  FACILITY        // Rental, Events
  COUNSELING      // Pastoral Care, Marriage Counseling
  OTHER
}

model ServiceOffering {
  id                  String          @id @default(cuid())
  tenantId            String
  tenant              Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name                String
  description         String
  category            ServiceCategory
  isPublic            Boolean         @default(true)
  requiresBooking     Boolean         @default(false)
  contactEmailOverride String?
  pricing             String?          // Free-form or JSON
  imageUrl            String?
  order               Int              @default(0)
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  deletedAt           DateTime?
  
  @@index([tenantId, category, isPublic])
}
```

#### Implementation
* Add to `lib/data.ts`:
  * `getServiceOfferingsForTenant(tenantId, isPublic?)` - Filter by public/all
  * `createServiceOffering(tenantId, data)`
  * `updateServiceOffering(id, data)`
  * `deleteServiceOffering(id)` - Soft delete

* API Routes:
  * `GET /api/tenants/[tenantId]/services` - List services
  * `POST /api/tenants/[tenantId]/services` - Create (ADMIN only)
  * `PATCH /api/tenants/[tenantId]/services/[id]` - Update
  * `DELETE /api/tenants/[tenantId]/services/[id]` - Delete

#### UI Pages
* **Services Page** (`app/tenants/[tenantId]/services/page.tsx`):
  * Grid of service cards with category filters
  * Public visibility (no auth required)
* **Service Detail** (`app/tenants/[tenantId]/services/[id]/page.tsx`):
  * Full description, pricing, contact button
  * "Request Info" button → opens contact form with service pre-selected
* **Admin Management** (`app/tenants/[tenantId]/admin/services`):
  * CRUD interface for service offerings

#### Permissions
* View public services: Everyone (no auth)
* View all services: MEMBERS
* Manage services: ADMIN + STAFF

#### Tests
* Public can view isPublic services
* Members see all services
* CRUD operations tenant-isolated
* Contact form pre-fills with service

---

### I3: Facilities & Booking System (Sprint I3)

#### Goals
* Define facility resources (rooms, equipment, venues)
* Booking request/approval workflow
* Prevent double-booking

#### Prerequisites
* Phase J Events enhancements (for event-facility linking)

#### Data Model (New Tables)
```prisma
enum FacilityType {
  ROOM
  HALL
  EQUIPMENT
  VEHICLE
  OTHER
}

model Facility {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  description String?
  type        FacilityType
  location    String?
  capacity    Int?
  isActive    Boolean   @default(true)
  bookingRules Json?    // Min/max duration, advance notice, etc.
  createdAt   DateTime  @default(now())
  bookings    FacilityBooking[]
  
  @@index([tenantId, isActive])
}

enum BookingStatus {
  REQUESTED
  APPROVED
  REJECTED
  CANCELLED
}

model FacilityBooking {
  id            String        @id @default(cuid())
  tenantId      String
  facilityId    String
  facility      Facility      @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  eventId       String?       // Optional link to event
  event         Event?        @relation(fields: [eventId], references: [id])
  requestedById String
  requestedBy   User          @relation(fields: [requestedById], references: [id])
  startAt       DateTime
  endAt         DateTime
  purpose       String
  status        BookingStatus @default(REQUESTED)
  notes         String?
  createdAt     DateTime      @default(now())
  
  @@index([tenantId, facilityId, startAt, endAt])
  @@index([requestedById])
}
```

#### Implementation
* Add to `lib/data.ts`:
  * `getFacilitiesForTenant(tenantId)`
  * `getFacilityById(facilityId)` - With bookings
  * `requestFacilityBooking(data)` - Check for conflicts
  * `approveFacilityBooking(bookingId)`
  * `checkFacilityAvailability(facilityId, startAt, endAt)` - Conflict detection
  * `getFacilityCalendar(facilityId, month)` - For calendar view

* API Routes:
  * `GET /api/tenants/[tenantId]/facilities` - List facilities
  * `POST /api/tenants/[tenantId]/facilities` - Create facility (ADMIN)
  * `GET /api/tenants/[tenantId]/facilities/[id]/bookings` - Bookings for facility
  * `POST /api/tenants/[tenantId]/facilities/[id]/book` - Request booking
  * `PATCH /api/tenants/[tenantId]/facilities/bookings/[id]` - Approve/reject

#### UI Pages
* **Facilities List** (`app/tenants/[tenantId]/facilities/page.tsx`):
  * Cards showing facility name, type, capacity
  * Availability indicator
  * "Request Booking" button
* **Facility Detail** (`app/tenants/[tenantId]/facilities/[id]/page.tsx`):
  * Calendar view of bookings
  * Booking request form (date/time pickers, purpose)
* **Admin Bookings** (`app/tenants/[tenantId]/admin/facilities`):
  * Pending requests list
  * Approve/reject buttons
  * Conflict warnings

#### Permissions
* View facilities: PUBLIC or MEMBERS (tenant setting)
* Request booking: MEMBERS
* Approve booking: ADMIN + new `canManageFacilities` permission
* Create facilities: ADMIN only

#### Tests
* Double-booking prevented (same facility, overlapping times)
* Booking request workflow
* Event-facility linkage
* Tenant isolation

---

## PHASE J: Events Enhancement

**Prerequisites:** Phase I complete (facilities for event-facility booking)

### J1: Event Registration with Capacity (Sprint J1)

#### Goals
* Allow event registration with capacity limits
* Waitlist support when capacity reached

#### Current State
* `Event` model exists
* `EventRSVP` model exists with GOING/INTERESTED/NOT_GOING statuses

#### Data Model Changes
```prisma
model Event {
  // ... existing fields ...
  capacity           Int?        // Max attendees
  allowWaitlist      Boolean     @default(false)
  requireRegistration Boolean    @default(false)
  registrationOpensAt DateTime?
  registrationClosesAt DateTime?
}

// New table for formal registrations (vs casual RSVPs)
model EventRegistration {
  id           String   @id @default(cuid())
  tenantId     String
  eventId      String
  event        Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId       String?  // Null if non-member registers
  user         User?    @relation(fields: [userId], references: [id])
  name         String   // Always capture name
  email        String
  phone        String?
  status       String   @default("REGISTERED")  // REGISTERED, WAITLISTED, CANCELLED, CHECKED_IN
  extraFields  Json?    // Custom form fields
  registeredAt DateTime @default(now())
  
  @@unique([eventId, email])
  @@index([tenantId, eventId, status])
}
```

#### Implementation
* Add to `lib/data.ts`:
  * `getEventRegistrations(eventId)`
  * `registerForEvent(eventId, data)` - Check capacity, waitlist if full
  * `cancelEventRegistration(registrationId)`
  * `getRegistrationStats(eventId)` - Count by status

* API Routes:
  * `POST /api/events/[eventId]/register` - Register for event
  * `GET /api/events/[eventId]/registrations` - List (ADMIN only)
  * `DELETE /api/events/[eventId]/registrations/[id]` - Cancel

#### UI Enhancements
* **Event Detail**: Registration widget showing capacity, waitlist status
* **Event Admin**: Registrations list with export to CSV

#### Tests
* Capacity enforcement
* Waitlist triggers when capacity reached
* Registration closes after deadline

---

### J2: Event Check-in System (Sprint J2)

#### Goals
* Check-in attendees at events
* Track actual attendance vs. registrations

#### Prerequisites
* Phase J1 Event Registration (for registration list)

#### Data Model (New Table)
```prisma
model EventAttendance {
  id           String    @id @default(cuid())
  tenantId     String
  eventId      String
  event        Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId       String?   // If member
  user         User?     @relation(fields: [userId], references: [id])
  name         String    // Always capture name
  checkedInAt  DateTime  @default(now())
  checkedInById String   // Staff who checked them in
  checkedInBy  User      @relation("CheckedInBy", fields: [checkedInById], references: [id])
  source       String    @default("MANUAL")  // MANUAL, REGISTRATION, SELF_CHECKIN
  notes        String?
  
  @@index([tenantId, eventId])
  @@index([userId])
}
```

#### Implementation
* Add to `lib/data.ts`:
  * `checkInAttendee(eventId, data)` - Record attendance
  * `getEventAttendance(eventId)` - List checked-in attendees
  * `bulkCheckIn(eventId, registrationIds[])` - Check in from registration list

* API Routes:
  * `POST /api/events/[eventId]/check-in` - Check in attendee
  * `GET /api/events/[eventId]/attendance` - View attendance
  * `POST /api/events/[eventId]/check-in/bulk` - Bulk check-in

#### UI Pages
* **Check-in Interface** (`app/tenants/[tenantId]/events/[id]/check-in`):
  * Search bar (name or email)
  * List of registrants with "Check In" buttons
  * Add walk-in attendee
  * Real-time count: X checked in / Y registered

#### Permissions
* Check-in: ADMIN + STAFF + event creator
* View attendance: Same as above

#### Tests
* Check-in records created
* Duplicate check-in prevented
* Attendance metrics for analytics

---

### J3: Multi-channel Event Publishing (Sprint J3)

#### Goals
* Control event visibility (public calendar, members-only, private)
* Email digest inclusion toggle

#### Data Model Changes
```prisma
enum EventVisibility {
  PUBLIC
  MEMBERS
  PRIVATE
}

model Event {
  // ... existing fields ...
  visibility            EventVisibility @default(MEMBERS)
  showOnPublicCalendar  Boolean        @default(true)
  includeInEmailDigest  Boolean        @default(true)
}
```

#### Implementation
* Update `lib/data.ts`:
  * `getEventsForTenant()` - Respect visibility based on user context
  * `getPublicEvents(tenantId)` - Only PUBLIC + showOnPublicCalendar

* Update event editor UI to include visibility toggles

#### Tests
* PUBLIC events visible to non-members
* MEMBERS events require auth
* PRIVATE events hidden from public calendar

---

## PHASE K: Donations & Finance

**Prerequisites:** Phase F3 Email Service (for donation receipts)

### K1: Funds & Enhanced Donations (Sprint K1)

#### Goals
* Multiple funds for designated giving
* Better donation tracking and reporting

#### Current State
* `DonationRecord` model exists with basic fields
* `TenantSettings.donationSettings` JSON field exists

#### Data Model Enhancement
```prisma
model Fund {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  description String?
  goalAmount  Float?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  donations   DonationRecord[]
  
  @@index([tenantId, isActive])
}

model DonationRecord {
  // ... existing fields ...
  fundId    String?
  fund      Fund?      @relation(fields: [fundId], references: [id])
  receiptSent Boolean  @default(false)
  receiptSentAt DateTime?
}
```

#### Implementation
* Add to `lib/data.ts`:
  * `getFundsForTenant(tenantId)`
  * `createFund(tenantId, data)`
  * `getDonationsByFund(tenantId, fundId, dateRange)`
  * `sendDonationReceipt(donationId)` - Uses Phase F3 email service

* API Routes:
  * `GET /api/tenants/[tenantId]/funds` - List funds
  * `POST /api/tenants/[tenantId]/funds` - Create fund (ADMIN)
  * `POST /api/tenants/[tenantId]/donations` - Record donation (existing, extend)

#### UI Pages
* **Giving Page** (`app/tenants/[tenantId]/giving/page.tsx`):
  * List of active funds with progress bars (if goals set)
  * "Give" button per fund (links to external or internal)
* **Admin Donations** (`app/tenants/[tenantId]/admin/donations`):
  * Record offline donations (cash, check)
  * Filter by fund, date range
  * Export for accounting

#### Tests
* Fund creation and assignment
* Donation reporting by fund
* Receipt email sent (mock in tests)

---

### K2: Annual Giving Statements (Sprint K2)

#### Goals
* Generate annual statements for tax purposes
* PDF export per donor

#### Prerequisites
* Phase K1 Funds system

#### Implementation
* Add to `lib/data.ts`:
  * `getAnnualGivingStatement(tenantId, userId, year)` - Aggregated by fund

* New API:
  * `GET /api/tenants/[tenantId]/donations/statement?year=2024&userId=xyz` - Generate PDF

* Use PDF generation library (e.g., `@react-pdf/renderer` or puppeteer)

#### UI
* **Admin Statements** (`app/tenants/[tenantId]/admin/donations/statements`):
  * Select year
  * Generate all statements (bulk)
  * Download individual statement

#### Tests
* Statement aggregates donations correctly
* PDF generates with correct data
* Only donor or ADMIN can access statement

---

## PHASE L: Content & Education

**Prerequisites:** Phase F4 Search Infrastructure, Phase F2 File Uploads

### L1: Courses / Classes System (Sprint L1)

#### Data Model (New Tables)
```prisma
model Course {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title       String
  description String
  category    String?   // "Bible Study", "Youth", "Adult Education"
  instructorId String?
  instructor  User?     @relation(fields: [instructorId], references: [id])
  capacity    Int?
  isPublished Boolean   @default(false)
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime  @default(now())
  sessions    CourseSession[]
  enrollments CourseEnrollment[]
  
  @@index([tenantId, isPublished])
}

model CourseSession {
  id          String   @id @default(cuid())
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title       String?
  sessionDate DateTime
  location    String?
  notes       String?
  order       Int
  
  @@index([courseId, sessionDate])
}

model CourseEnrollment {
  id          String   @id @default(cuid())
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  status      String   @default("ENROLLED")  // ENROLLED, COMPLETED, DROPPED
  enrolledAt  DateTime @default(now())
  completedAt DateTime?
  
  @@unique([courseId, userId])
  @@index([userId])
}
```

#### UI Pages
* **Courses Directory** (`app/tenants/[tenantId]/courses`):
  * Grid of published courses
  * Enroll button
* **Course Detail** (`app/tenants/[tenantId]/courses/[id]`):
  * Sessions schedule
  * Instructor info
  * Enrollment status

---

### L2: Resource Library Enhancements (Sprint L2)

#### Goals
* Enhance existing `ResourceItem` model with better search/filtering

#### Current State
* `ResourceItem` model exists with basic fields
* `TenantSettings.enableResourceCenter` toggle exists

#### Data Model Changes
```prisma
model ResourceItem {
  // ... existing fields ...
  tags      String?     // JSON array or comma-separated
  language  String?     // ISO code
  difficulty String?    // Beginner, Intermediate, Advanced
  category  String?     // Bible Study, Prayer, Theology, etc.
}
```

#### Implementation
* Enhance search to use Phase F4 search infrastructure
* Add tag-based filtering
* Add language filtering

---

### L3: Sermon Series / Collections (Sprint L3)

#### Data Model (New Table)
```prisma
model SermonSeries {
  id           String    @id @default(cuid())
  tenantId     String
  tenant       Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title        String
  description  String?
  coverImageId String?
  startDate    DateTime?
  endDate      DateTime?
  createdAt    DateTime  @default(now())
  
  @@index([tenantId, startDate])
}

// Add to existing MediaItem or Post for sermons
model MediaItem {
  // ... existing fields ...
  seriesId  String?
  series    SermonSeries? @relation(fields: [seriesId], references: [id])
}
```

#### UI
* **Series Index**: List of series with cover images
* **Series Detail**: All sermons in series

---

## PHASE M: Multi-language & Accessibility

**Prerequisites:** Phase F4 Search (for multi-language search)

### M1: Content Language Tagging (Sprint M1)

#### Data Model Changes
Add `language` field (ISO 639-1 code) to:
* `Post`
* `Event`
* `MediaItem` (sermons)
* `ResourceItem`
* `Course`

#### UI
* Language selector on content lists
* Filter by language

---

### M2: Content Translation System (Sprint M2)

#### Data Model (New Table)
```prisma
model ContentTranslation {
  id         String   @id @default(cuid())
  tenantId   String
  entityType String   // Post, Event, Resource, etc.
  entityId   String
  language   String   // ISO code
  title      String
  body       String?
  metadata   Json?    // Additional translated fields
  createdAt  DateTime @default(now())
  
  @@unique([entityType, entityId, language])
  @@index([tenantId, entityType, entityId])
}
```

---

### M3: Accessibility Enhancements (Sprint M3)

#### TenantSettings Changes
```prisma
model TenantSettings {
  // ... existing fields ...
  highContrastDefault Boolean @default(false)
  largeTextDefault    Boolean @default(false)
  requireTranscripts  Boolean @default(false)
}
```

#### UI Requirements
* WCAG 2.1 AA compliance
* Keyboard navigation
* Screen reader support
* Transcript enforcement for audio/video

---

## PHASE N: Analytics & Admin Power Tools

**Prerequisites:** ALL prior phases (logs events from F-M)

### N1: Analytics Event Logging (Sprint N1)

#### Data Model (New Table)
```prisma
enum AnalyticsEventType {
  POST_VIEW
  EVENT_RSVP
  EVENT_CHECKIN
  DONATION_CREATED
  GROUP_ATTENDANCE
  PRAYER_REQUEST_CREATED
  VOLUNTEER_SIGNUP
  COURSE_ENROLLMENT
  RESOURCE_DOWNLOAD
  PAGE_VIEW
}

model AnalyticsEvent {
  id         String              @id @default(cuid())
  tenantId   String
  userId     String?
  type       AnalyticsEventType
  entityType String?             // Post, Event, etc.
  entityId   String?
  occurredAt DateTime            @default(now())
  metadata   Json?               // Additional context
  
  @@index([tenantId, type, occurredAt])
  @@index([entityType, entityId])
}
```

#### Implementation
* Add `recordAnalyticsEvent()` to `lib/data.ts`
* Instrument throughout codebase:
  * Post views
  * Event RSVPs
  * Check-ins
  * Donations
  * Course enrollments
  * etc.

---

### N2: Tenant Analytics Dashboard (Sprint N2)

#### Implementation
* Add to `lib/data.ts`:
  * `getTenantMetrics(tenantId, dateRange)` - Aggregated metrics
  * `getEngagementTrends(tenantId, metric, dateRange)` - Time series
  * `getPopularContent(tenantId, type, limit)` - Top posts, events, etc.

* API:
  * `GET /api/tenants/[tenantId]/analytics` - Dashboard data

#### UI Page
* **Admin Analytics** (`app/tenants/[tenantId]/admin/analytics`):
  * Cards: Active members, event attendance, giving totals, content views
  * Charts: Trends over time
  * Filters: Date range, category

---

### N3: Platform Admin Dashboard (Sprint N3)

#### UI Page
* **Super Admin Dashboard** (`app/admin/analytics`):
  * All tenants overview
  * Top tenants by activity
  * Platform health metrics
  * User growth trends

---

### N4: Roles & Permissions Templates (Sprint N4)

#### Implementation
Predefined templates that apply sets of TenantSettings:
* "Very Open" - Public visibility, open membership
* "Moderated" - Approval required, moderation enabled
* "Private" - Members-only, strict privacy

UI to select and apply templates with confirmation.

---

### N5: Tenant Data Export / Backup (Sprint N5)

#### Implementation
* API:
  * `GET /api/tenants/[tenantId]/export?format=json` - Full data export

* Includes: Members, posts, events, media metadata, donations, etc.
* Tenant-scoped only
* JSON or CSV bundle

---

### N6: Settings Change History (Sprint N6)

#### Data Model (New Table)
```prisma
model TenantSettingsAudit {
  id              String   @id @default(cuid())
  tenantId        String
  changedById     String
  changedBy       User     @relation(fields: [changedById], references: [id])
  changedAt       DateTime @default(now())
  previousValues  Json
  newValues       Json
  changeSummary   String?
  
  @@index([tenantId, changedAt])
}
```

#### UI
* Admin "Change History" tab showing diffs

---

### N7: Member Experience Enhancements (Sprint N7)

#### Features
* **Personal Feed**: Aggregated content from subscribed channels
* **Email Digest**: Weekly summary (uses Phase F3 email service)
* **Recommendations**: Suggested groups, events, courses (based on analytics)
* **Badges**: Participation badges (optional tenant feature)

---

## Implementation Priority Summary

### Phase F (Foundation) - DO FIRST
1. TypeScript Error Resolution (Week 1) - BLOCKING
2. File Upload Service (Week 2) - Required by G, L
3. Email Service (Week 2-3) - Required by H, K
4. Search Infrastructure (Week 3) - Required by L, M

### Phase G (Content Enhancements)
1. Social Links (Week 1) - Easy win
2. Nav Customization (Week 2) - Foundation for flexibility
3. Photo Gallery (Week 3) - Requires F2
4. Comments (Week 4) - Engagement boost

### Phase H (Pastoral Care)
1. Prayer Requests 2.0 (Week 1)
2. Visitor Follow-up (Week 2)
3. Pastoral Care Tracker (Week 3)
4. Small Group Attendance (Week 4)

### Phase I (Volunteer & Service)
1. Volunteer Scheduling (Week 1)
2. Service Offerings (Week 2)
3. Facilities & Booking (Week 3)

### Phase J (Events)
1. Event Registration (Week 1)
2. Event Check-in (Week 2)
3. Multi-channel Publishing (Week 3)

### Phase K (Donations)
1. Funds & Enhanced Donations (Week 1)
2. Annual Statements (Week 2)

### Phase L (Content & Education)
1. Courses System (Week 1)
2. Resource Library Enhancement (Week 2)
3. Sermon Series (Week 3)

### Phase M (Multi-language)
1. Language Tagging (Week 1)
2. Translation System (Week 2)
3. Accessibility (Week 3)

### Phase N (Analytics & Admin)
1. Event Logging (Week 1)
2. Tenant Analytics (Week 2)
3. Platform Analytics (Week 3)
4-7. Admin Tools (Week 4-6)

---

## Key Decisions Made

1. **Service Layer**: Keep using `lib/data.ts` pattern instead of `lib/services/*` for consistency
2. **TypeScript Errors**: Phase F1 must complete before other phases
3. **File Uploads**: Phase F2 is prerequisite for Gallery, Resource enhancements
4. **Email**: Phase F3 enables notifications, campaigns, receipts throughout
5. **Soft Delete**: Standardize on `deletedAt?: DateTime` for all new models
6. **Phasing Order**: Reordered to ensure prerequisites met before dependent features
7. **Testing**: Every feature adds tests to existing test suite files


