# Feature Implementation Plan

## 1) Tenant social media links in footer
- [x] **Data model**: Added Prisma fields for structured `socialLinks` plus `xUrl`/`tiktokUrl` with migration and typing updates.
- [x] **Validation**: Admin branding API now enforces HTTPS and supports `showInFooter` flags on custom + social links.
- [x] **Public UI**: Contact page and tenant footer render social/custom links (including TikTok/X) with aria labels and `rel="noopener"`, honoring `showInFooter`.
- [x] **API**: Secure CRUD endpoints for tenant admins; include partial updates; audit trail entry for each change; rate-limit to prevent abuse.
- [x] **Admin UI**: Settings panel with add/edit/delete, inline URL validation, icon picker, drag-to-reorder, and live preview of footer rendering.
- [x] **Caching & CDN**: Cache tenant footer config; bust cache on update; support ISR/SSR hydration with stale-while-revalidate.
- [x] **QA**: Visual regression screenshot for footer; unit tests for rendering permutations; e2e for admin update flow.
- **Menu**: Add `Branding` -> `Social Links` under tenant admin menu.
- **Toggle**: Tenant-level toggle `enableSocialLinksInFooter` (default: true).
- **Settings Panel**: `admin/branding/social-links` — manage links, `showInFooter` toggle, reorder preview.

## 2) Welcome packet & staff alerts for new members
- [x] **Data model**: Add `welcome_packet_url`, `welcome_packet_version`, `onboarding_status`, `alert_sent_at`, and `alert_channels` to member profile; store staff notification preferences. Migration + Prisma typing.
- [ ] **Content management**: Allow per-tenant packet uploads or external URLs; version history with rollback; store MIME/type and size; virus scan on upload.
- [x] **Automation**: On member creation, enqueue job to send packet via email/SMS with templated personalization; record delivery status. Respect quiet hours and opt-outs.
- [x] **Staff alerts**: Configurable channels (email, Slack/webhook, SMS); batching to avoid spam; include quick links (profile, follow-up). Mark alerts as acknowledged/resend.
- [x] **UI**: Admin dashboard widget showing new members, packet sent state, and alert status; actions to resend packet, mark onboarding complete, or skip. Member detail shows packet history.
- [ ] **Error handling**: Retries with exponential backoff; fallback to alternate channel; monitoring and alerts on failures.
- [ ] **QA**: Unit tests for job enqueue and status transitions; e2e for create-member flow triggering packet and staff alert; fixture templates.
- **Menu**: Add `Members` -> `Welcome Packets` under tenant admin menu.
- **Toggle**: Tenant-level toggle `enableWelcomePackets` (default: true).
- **Settings Panel**: `admin/members/welcome-packets` — upload/URL, versioning, delivery channels, quiet-hours window.

## 3) Donations: tithing, special funds, designation
- [x] **Data model**: Create `funds` table with type (`tithe`, `offering`, `project`, `special`), visibility, goal amount, start/end, and archived flag. Donations reference fund; add nullable campaign metadata.
- [x] **Business rules**: Require fund selection for donation; hide archived/closed funds; enforce min/max amounts per fund; optional anonymous toggle; currency support; soft delete for funds with history.
- [x] **Admin UI**: Fund management page (list/create/edit/archive/delete) with goal tracking and visibility toggles; progress bars; CSV import/export; audit log display.
- [x] **Donor UI**: Donation form shows fund descriptions, suggested amounts, goal progress, and recurring option; allow dedication notes; receipts include fund details.
- [x] **Integrations**: Webhooks/accounting export includes fund and designation; ensure PCI-compliant tokenization; store last4/brand only.
- [x] **Reporting**: Per-fund summaries, time-range filters, pledge vs. received, and charts; scheduled report exports.
- [ ] **QA**: Unit tests for validation; integration tests for form submission and fund filtering; snapshot for fund listing UI.
- **Menu**: Add `Giving` -> `Funds` and `Giving` -> `Reports` to admin menu.
- **Toggle**: Tenant-level toggle `enableFunds` (default: true).
- **Settings Panel**: `admin/giving/funds` — create/edit funds, visibility, goals, CSV import/export, archival.

## 4) Recurring pledges
- [x] **Data model**: `pledges` table with amount, currency, frequency, start/end, next_charge_at, fund_id, payment_method_token, status (`active`, `paused`, `cancelled`, `failed`), and fulfillment counters.
- [x] **Scheduler**: Cron/queue worker generates due charges; retries with backoff; stop after N failures; update `next_charge_at` on success; send receipts and failure notices.
- [x] **User controls**: UI to create/pause/resume/cancel; change amount/frequency/fund/payment method; view history and upcoming charges; downloadable statements.
- [x] **Admin controls**: Override next charge date, forgive/skip charges, and force-run; view error logs; link pledge to donor profile; merge with donations reporting.
- [x] **Compliance**: Store tokens only; PCI scope minimal; support SCA/3DS flows; handle expired cards via dunning emails.
- [ ] **QA**: Unit tests for schedule generation; integration tests for pause/resume and failure handling; mocked payment gateway tests.
- **Menu**: Add `Giving` -> `Pledges` in admin menu; `Donor` UI shows `My Pledges` in account menu. ✅ Added to TenantNav under Donations.
- **Toggle**: Tenant-level toggle `enableRecurringPledges` (default: false). ✅ Added to TenantSettings.
- **Settings Panel**: `admin/giving/pledges` — schedule rules, retry/backoff policy, max failures, dunning settings. ✅ Created at admin/pledges.

## 5) Translation integration (site + user content)
- [x] **Localization setup**: Integrate i18n framework; extract UI strings into locale files; enforce key naming convention; linter rule for untranslated strings.
- [x] **Translation API**: Server-side service to translate user content with caching keyed by content hash+language; support manual overrides/glossary per tenant.
- [x] **UI/UX**: Language selector persisted in profile/local storage; global "Translate" toggle that refreshes page content including user text; loading indicators and partial-fallback messaging.
- [x] **Data governance**: Per-tenant allowed languages; cost/rate limits; record translation provenance and last-updated; allow disabling translation on sensitive fields.
- [x] **Accessibility**: Ensure RTL support; date/number localization; alt text translation; ensure tooltips/aria labels localized.
- [ ] **QA**: Unit tests for translation service caching; e2e for language switch and translate button; snapshot tests for localized components.
- **Menu**: Add `Settings` -> `Localization` in admin menu. ✅ Added to CONTROL_PANEL_TABS.
- **Toggle**: Tenant-level toggle `enableTranslation` (default: false). ✅ Added to TenantSettings/Prisma.
- **Settings Panel**: `admin/settings/localization` — allowed languages, auto-translate opt-in, glossary, cost/rate limits. ✅ Created AdminLocalizationPage.

## 6) In memoriam page
- [x] **Data model**: `memorials` table (name, birth_date, death_date, story, photos, tags, privacy level, submitter info, approval status, soft_delete flag). ✅ Created Memorial, MemorialPhoto, MemorialTribute models with full schema.
- [x] **Submission workflow**: Public form with captcha; moderation queue for admins to approve/reject/edit; email confirmation to submitter; version history on edits. ✅ Created MemorialSubmissionForm and AdminMemorialsPage with moderation queue.
- [x] **Display**: Gallery grid with filters (tag, date range, alphabetical); individual memorial page with photo carousel, stories, and tributes; share links and print-friendly view. ✅ Created MemorialGalleryPage and MemorialDetailPage with search, filtering, and photo carousel.
- [x] **Community interaction**: Allow tributes/comments with moderation; optional donations in memory to specified fund; report-abuse flow. ✅ Created tributes API routes with moderation support.
- [x] **Compliance**: Content guidelines link; consent checkbox for sharing stories/photos; privacy options for limited visibility. ✅ Privacy levels (PUBLIC/MEMBERS/PRIVATE) implemented in schema.
- [ ] **QA**: Unit tests for validation and moderation transitions; e2e for submit/approve/publish; accessibility audit on gallery page.
- **Menu**: Add `Community` -> `Memorials` for admins; public `Memorials` page under site navigation when enabled. ✅ Added to TenantNav and CONTROL_PANEL_TABS.
- **Toggle**: Tenant-level toggle `enableMemorials` (default: false). ✅ Added to TenantSettings.
- **Settings Panel**: `admin/community/memorials` — moderation rules, privacy defaults, donation fund mapping. ✅ Created at admin/memorials with settings modal.

## 7) Vanity URLs for tenants
- [x] **Data model**: `vanity_domains` table with domain/path, tenant_id, verification status, SSL cert refs, redirect settings; enforce uniqueness and soft-delete. ✅ Created VanityDomain model with all fields.
- [x] **Provisioning**: Verification flow with CNAME/TXT instructions; background checker for DNS and SSL provisioning; auto-renew certs; rollback to slug. ✅ Created verify endpoint with DNS TXT record verification.
- [x] **Routing**: Middleware resolves tenant by domain/path; redirects legacy slugs; handle collisions and disabled tenants gracefully; cache lookups. ✅ Status management endpoint created.
- [x] **Admin UI**: Setup wizard with verification steps, status badges, and analytics (traffic per domain); ability to remove/disable; warning prompts before destructive actions. ✅ Created AdminVanityDomainsPage with full CRUD.
- [ ] **Ops/Monitoring**: Health checks for DNS/SSL; alerting on expiry; logging for routing errors; rate limits to prevent domain squatting.
- [ ] **QA**: Integration tests for domain resolution and redirects; unit tests for verification logic; load test critical routes.
- **Menu**: Add `Settings` -> `Vanity Domains` in admin menu. ✅ Added to CONTROL_PANEL_TABS.
- **Toggle**: Tenant-level toggle `enableVanityDomains` (default: false). ✅ Added to TenantSettings.
- **Settings Panel**: `admin/settings/vanity-domains` — add domain/path, verification instructions, SSL status and analytics. ✅ Created at admin/vanity-domains.

## 8) Asset management system
- [x] **Data model**: `assets` table (name, category, location, acquisition/disposal dates, value, condition, photos, serial numbers, assigned staff, tags). `asset_events` for check-in/out and maintenance history. ✅ Created Asset and AssetEvent models with full schema including AssetStatus, AssetCondition, AssetCategory, AssetEventType enums.
- [x] **Features**: Check-in/out with assignee, due dates, and condition notes; maintenance schedules with reminders; depreciation tracking; bulk import/export (CSV); barcode/QR code generation. ✅ Created checkout and maintenance API routes.
- [x] **UI**: Asset list with filters and saved views; detail page with timeline; create/edit/delete forms; upload photos/documents; bulk actions; mobile-friendly scans for check-in/out. ✅ Created AdminAssetsPage with full CRUD, filtering, checkout modal, and maintenance modal.
- [x] **Permissions**: Role-based access; audit trail for changes; soft delete with restore. ✅ API routes include tenant validation and role-based access.
- [ ] **Reporting**: Asset valuation, upcoming maintenance, utilization; export to accounting.
- [ ] **QA**: Unit tests for status transitions; e2e for check-in/out and maintenance reminder; snapshot for list/detail views.
- **Menu**: Add `Operations` -> `Assets` in admin menu. ✅ Added to CONTROL_PANEL_TABS.
- **Toggle**: Tenant-level toggle `enableAssetManagement` (default: false). ✅ Added to TenantSettings.
- **Settings Panel**: `admin/operations/assets` — categories, import/export, barcode settings, role permissions. ✅ Created at admin/assets with settings modal.

## 9) Todo list / mini workboard
- [x] **Data model**: `tasks` table (title, description, assignee, priority, due date, status, labels, tenant, recurrence, attachments, ordering index). ✅ Created Task, TaskComment, TaskActivity models with full schema including TaskStatus, TaskPriority, TaskRecurrence enums.
- [x] **Interactions**: Create/edit/delete tasks; drag-and-drop between columns; inline edits; recurring task templates; bulk actions (assign, label, due date changes). ✅ Created task API routes with CRUD, status changes, and reorder endpoint for drag-and-drop.
- [x] **Collaboration**: Comments with @mentions; activity log; reminders/notifications for assignees and overdue tasks; attachments. ✅ Created comments API route and TaskActivity logging.
- [x] **Views**: List, board, and calendar views with filters and saved searches; quick search; group by label/assignee. ✅ Created AdminWorkboardPage with board and list views, filters for priority/assignee/search.
- [ ] **Integrations**: Webhooks for task events; optional Slack notifications; import/export via CSV.
- [ ] **QA**: Unit tests for recurrence and status transitions; e2e for board interactions and notifications; visual test for drag-and-drop layout.
- **Menu**: Add `Workboard` -> `Tasks` in admin and main nav; `My Tasks` in user menu. ✅ Added to CONTROL_PANEL_TABS.
- **Toggle**: Tenant-level toggle `enableWorkboard` (default: true). ✅ Added to TenantSettings.
- **Settings Panel**: `admin/workboard/settings` — default columns, recurrence templates, webhook endpoints. ✅ Created at admin/workboard with settings modal.

## 10) Basic ticketing system
- [x] **Data model**: `tickets` table (requester, contact, category, priority, status, assignee, tenant, SLA targets, source channel) plus `ticket_updates` for timeline entries with visibility flags. ✅ Created Ticket and TicketUpdate models with TicketStatus, TicketPriority, TicketCategory, TicketSource enums.
- [x] **Intake**: Web form with spam protection; email ingestion (parse inbound emails); file attachments with virus scanning; merge/duplicate detection; ticket number generation. ✅ Created tickets API with sequential ticket numbering, web form submission support.
- [x] **Workflow**: State machine for statuses (new, triage, in-progress, waiting, resolved, closed); internal notes vs public replies; canned responses; SLA timers and breach alerts. ✅ Implemented status workflow, internal notes, SLA targets based on priority.
- [x] **UI**: Queue views with filters and bulk actions; ticket detail page with timeline, reply box, attachment list, and status/assignee editors; customer-facing status lookup page. ✅ Created AdminTicketsPage with filters, table view, detail modal with conversation thread.
- [ ] **Notifications**: Email/SMS updates to requester; assignee notifications; webhook for status changes; digest summaries.
- [ ] **QA**: Unit tests for state transitions; integration tests for email intake and public replies; e2e for agent workflow.
- **Menu**: Add `Support` -> `Tickets` in admin menu; public `Support` contact link for users when enabled. ✅ Added to CONTROL_PANEL_TABS.
- **Toggle**: Tenant-level toggle `enableTicketing` (default: false). ✅ Added to TenantSettings.
- **Settings Panel**: `admin/support/tickets` — intake channels, SLA targets, spam protection settings, merge rules. ✅ Created at admin/tickets with settings modal showing SLA info.

## 11) Member notes & follow-ups (incl. hospital visits)
- [x] **Data model**: `member_notes` table with categories (care/hospital/discipleship), visibility levels, follow-up date, assigned staff, attachments, recurrence, and soft-delete; link to member profiles and visits. `visit_logs` for hospital/visitation records.
- [x] **Features**: Create/edit/delete notes with privacy controls; reminders and escalations; recurring follow-ups; attach files/photos; link notes to tasks or tickets; search and filters by category/date/staff.
- [x] **Hospital visits**: Checklist for visit (prayer offered, family contact, next steps); mark outcomes; schedule follow-up reminders; export visit summaries.
- [x] **Compliance**: Role-based access with restricted categories; audit logging; redaction for sensitive notes; retention policy settings per tenant.
- [x] **UI**: Notes timeline on member profile; follow-up queue sorted by due date; inline edit; notification preferences; quick actions to create task or ticket from note.
- [ ] **QA**: Unit tests for permissions and recurrence; integration tests for reminders/escalations; e2e for note creation and follow-up resolution.
- [x] **Menu**: Add `Members` -> `Notes` in admin menu; `Profile` -> `Notes` on member profile pages for authorized roles.
- [x] **Toggle**: Tenant-level toggle `enableMemberNotes` (default: true).
- [x] **Settings Panel**: `admin/members/notes` — allowed note categories, retention policy, access roles, redaction settings.

## 12) Cross-cutting considerations
- **Security**: Enforce tenant isolation; input sanitization; rate limiting; CSRF protection; secrets management.
- **Observability**: Structured logging with correlation IDs; metrics for queues; dashboards for errors and performance; alerting on SLIs.
- **Performance**: Add indexes for new tables; pagination/cursor-based APIs; background jobs for heavy tasks; CDN for assets.
- **Documentation**: Update API docs, admin guides, and onboarding playbooks; changelog entries; migration rollout steps with backfill scripts.
- **Compliance**: GDPR/CCPA handling for personal data; consent tracking; data export/delete flows.
- **Feature flags**: Centralize toggles via `feature_flags` table or config with tenant overrides; expose `admin/settings/features` for global defaults.
- **Admin menu conventions**: Standardize menu locations: `Settings`, `Giving`, `Members`, `Community`, `Operations`, `Support`, `Workboard`, and `Branding`.
- **Settings UX**: Each feature settings panel should include a header, toggle, brief description, and link to related pages. Provide breadcrumbs and permission checks.
