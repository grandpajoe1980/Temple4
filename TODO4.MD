# Feature Implementation Plan

## 1) Tenant social media links in footer
- **Data model**: Add nullable social fields to tenant settings (`facebook_url`, `instagram_url`, `youtube_url`, `tiktok_url`, `x_url`, `linkedin_url`, `website_url`, `custom_links[]`), plus boolean `show_in_footer` per link. Add migration and Prisma type updates.
- **Validation**: Enforce HTTPS URLs, normalized handles, and max length; strip tracking params; disallow unapproved domains; add unit tests.
- **API**: Secure CRUD endpoints for tenant admins; include partial updates; audit trail entry for each change; rate-limit to prevent abuse.
- **Admin UI**: Settings panel with add/edit/delete, inline URL validation, icon picker, drag-to-reorder, and live preview of footer rendering.
- **Public UI**: Footer component reads tenant cache; renders accessible icons with aria-labels; opens in new tab with rel="noopener"; hide when empty or feature disabled. Add loading/skeleton and error fallback.
- **Caching & CDN**: Cache tenant footer config; bust cache on update; support ISR/SSR hydration with stale-while-revalidate.
- **QA**: Visual regression screenshot for footer; unit tests for rendering permutations; e2e for admin update flow.

## 2) Welcome packet & staff alerts for new members
- **Data model**: Add `welcome_packet_url`, `welcome_packet_version`, `onboarding_status`, `alert_sent_at`, and `alert_channels` to member profile; store staff notification preferences. Migration + Prisma typing.
- **Content management**: Allow per-tenant packet uploads or external URLs; version history with rollback; store MIME/type and size; virus scan on upload.
- **Automation**: On member creation, enqueue job to send packet via email/SMS with templated personalization; record delivery status. Respect quiet hours and opt-outs.
- **Staff alerts**: Configurable channels (email, Slack/webhook, SMS); batching to avoid spam; include quick links (profile, follow-up). Mark alerts as acknowledged/resend.
- **UI**: Admin dashboard widget showing new members, packet sent state, and alert status; actions to resend packet, mark onboarding complete, or skip. Member detail shows packet history.
- **Error handling**: Retries with exponential backoff; fallback to alternate channel; monitoring and alerts on failures.
- **QA**: Unit tests for job enqueue and status transitions; e2e for create-member flow triggering packet and staff alert; fixture templates.

## 3) Donations: tithing, special funds, designation
- **Data model**: Create `funds` table with type (`tithe`, `offering`, `project`, `special`), visibility, goal amount, start/end, and archived flag. Donations reference fund; add nullable campaign metadata.
- **Business rules**: Require fund selection for donation; hide archived/closed funds; enforce min/max amounts per fund; optional anonymous toggle; currency support; soft delete for funds with history.
- **Admin UI**: Fund management page (list/create/edit/archive/delete) with goal tracking and visibility toggles; progress bars; CSV import/export; audit log display.
- **Donor UI**: Donation form shows fund descriptions, suggested amounts, goal progress, and recurring option; allow dedication notes; receipts include fund details.
- **Integrations**: Webhooks/accounting export includes fund and designation; ensure PCI-compliant tokenization; store last4/brand only.
- **Reporting**: Per-fund summaries, time-range filters, pledge vs. received, and charts; scheduled report exports.
- **QA**: Unit tests for validation; integration tests for form submission and fund filtering; snapshot for fund listing UI.

## 4) Recurring pledges
- **Data model**: `pledges` table with amount, currency, frequency, start/end, next_charge_at, fund_id, payment_method_token, status (`active`, `paused`, `cancelled`, `failed`), and fulfillment counters.
- **Scheduler**: Cron/queue worker generates due charges; retries with backoff; stop after N failures; update `next_charge_at` on success; send receipts and failure notices.
- **User controls**: UI to create/pause/resume/cancel; change amount/frequency/fund/payment method; view history and upcoming charges; downloadable statements.
- **Admin controls**: Override next charge date, forgive/skip charges, and force-run; view error logs; link pledge to donor profile; merge with donations reporting.
- **Compliance**: Store tokens only; PCI scope minimal; support SCA/3DS flows; handle expired cards via dunning emails.
- **QA**: Unit tests for schedule generation; integration tests for pause/resume and failure handling; mocked payment gateway tests.

## 5) Translation integration (site + user content)
- **Localization setup**: Integrate i18n framework; extract UI strings into locale files; enforce key naming convention; linter rule for untranslated strings.
- **Translation API**: Server-side service to translate user content with caching keyed by content hash+language; support manual overrides/glossary per tenant.
- **UI/UX**: Language selector persisted in profile/local storage; global "Translate" toggle that refreshes page content including user text; loading indicators and partial-fallback messaging.
- **Data governance**: Per-tenant allowed languages; cost/rate limits; record translation provenance and last-updated; allow disabling translation on sensitive fields.
- **Accessibility**: Ensure RTL support; date/number localization; alt text translation; ensure tooltips/aria labels localized.
- **QA**: Unit tests for translation service caching; e2e for language switch and translate button; snapshot tests for localized components.

## 6) In memoriam page
- **Data model**: `memorials` table (name, birth_date, death_date, story, photos, tags, privacy level, submitter info, approval status, soft_delete flag).
- **Submission workflow**: Public form with captcha; moderation queue for admins to approve/reject/edit; email confirmation to submitter; version history on edits.
- **Display**: Gallery grid with filters (tag, date range, alphabetical); individual memorial page with photo carousel, stories, and tributes; share links and print-friendly view.
- **Community interaction**: Allow tributes/comments with moderation; optional donations in memory to specified fund; report-abuse flow.
- **Compliance**: Content guidelines link; consent checkbox for sharing stories/photos; privacy options for limited visibility.
- **QA**: Unit tests for validation and moderation transitions; e2e for submit/approve/publish; accessibility audit on gallery page.

## 7) Vanity URLs for tenants
- **Data model**: `vanity_domains` table with domain/path, tenant_id, verification status, SSL cert refs, redirect settings; enforce uniqueness and soft-delete.
- **Provisioning**: Verification flow with CNAME/TXT instructions; background checker for DNS and SSL provisioning; auto-renew certs; rollback to slug.
- **Routing**: Middleware resolves tenant by domain/path; redirects legacy slugs; handle collisions and disabled tenants gracefully; cache lookups.
- **Admin UI**: Setup wizard with verification steps, status badges, and analytics (traffic per domain); ability to remove/disable; warning prompts before destructive actions.
- **Ops/Monitoring**: Health checks for DNS/SSL; alerting on expiry; logging for routing errors; rate limits to prevent domain squatting.
- **QA**: Integration tests for domain resolution and redirects; unit tests for verification logic; load test critical routes.

## 8) Asset management system
- **Data model**: `assets` table (name, category, location, acquisition/disposal dates, value, condition, photos, serial numbers, assigned staff, tags). `asset_events` for check-in/out and maintenance history.
- **Features**: Check-in/out with assignee, due dates, and condition notes; maintenance schedules with reminders; depreciation tracking; bulk import/export (CSV); barcode/QR code generation.
- **UI**: Asset list with filters and saved views; detail page with timeline; create/edit/delete forms; upload photos/documents; bulk actions; mobile-friendly scans for check-in/out.
- **Permissions**: Role-based access; audit trail for changes; soft delete with restore.
- **Reporting**: Asset valuation, upcoming maintenance, utilization; export to accounting.
- **QA**: Unit tests for status transitions; e2e for check-in/out and maintenance reminder; snapshot for list/detail views.

## 9) Todo list / mini workboard
- **Data model**: `tasks` table (title, description, assignee, priority, due date, status, labels, tenant, recurrence, attachments, ordering index).
- **Interactions**: Create/edit/delete tasks; drag-and-drop between columns; inline edits; recurring task templates; bulk actions (assign, label, due date changes).
- **Collaboration**: Comments with @mentions; activity log; reminders/notifications for assignees and overdue tasks; attachments.
- **Views**: List, board, and calendar views with filters and saved searches; quick search; group by label/assignee.
- **Integrations**: Webhooks for task events; optional Slack notifications; import/export via CSV.
- **QA**: Unit tests for recurrence and status transitions; e2e for board interactions and notifications; visual test for drag-and-drop layout.

## 10) Basic ticketing system
- **Data model**: `tickets` table (requester, contact, category, priority, status, assignee, tenant, SLA targets, source channel) plus `ticket_updates` for timeline entries with visibility flags.
- **Intake**: Web form with spam protection; email ingestion (parse inbound emails); file attachments with virus scanning; merge/duplicate detection; ticket number generation.
- **Workflow**: State machine for statuses (new, triage, in-progress, waiting, resolved, closed); internal notes vs public replies; canned responses; SLA timers and breach alerts.
- **UI**: Queue views with filters and bulk actions; ticket detail page with timeline, reply box, attachment list, and status/assignee editors; customer-facing status lookup page.
- **Notifications**: Email/SMS updates to requester; assignee notifications; webhook for status changes; digest summaries.
- **QA**: Unit tests for state transitions; integration tests for email intake and public replies; e2e for agent workflow.

## 11) Member notes & follow-ups (incl. hospital visits)
- **Data model**: `member_notes` table with categories (care/hospital/discipleship), visibility levels, follow-up date, assigned staff, attachments, recurrence, and soft-delete; link to member profiles and visits. `visit_logs` for hospital/visitation records.
- **Features**: Create/edit/delete notes with privacy controls; reminders and escalations; recurring follow-ups; attach files/photos; link notes to tasks or tickets; search and filters by category/date/staff.
- **Hospital visits**: Checklist for visit (prayer offered, family contact, next steps); mark outcomes; schedule follow-up reminders; export visit summaries.
- **Compliance**: Role-based access with restricted categories; audit logging; redaction for sensitive notes; retention policy settings per tenant.
- **UI**: Notes timeline on member profile; follow-up queue sorted by due date; inline edit; notification preferences; quick actions to create task or ticket from note.
- **QA**: Unit tests for permissions and recurrence; integration tests for reminders/escalations; e2e for note creation and follow-up resolution.

## 12) Cross-cutting considerations
- **Security**: Enforce tenant isolation; input sanitization; rate limiting; CSRF protection; secrets management.
- **Observability**: Structured logging with correlation IDs; metrics for queues; dashboards for errors and performance; alerting on SLIs.
- **Performance**: Add indexes for new tables; pagination/cursor-based APIs; background jobs for heavy tasks; CDN for assets.
- **Documentation**: Update API docs, admin guides, and onboarding playbooks; changelog entries; migration rollout steps with backfill scripts.
- **Compliance**: GDPR/CCPA handling for personal data; consent tracking; data export/delete flows.
