# Temple Platform UI Improvement Plan

This document inventories every screen, route, and shared UI surface in the Temple Platform repository and outlines a phased modernization plan. The goal is to elevate clarity, consistency, responsiveness, and delight without altering underlying routes, server actions, or data workflows. Every phase below maintains the existing backend contracts—only client-side presentation layers are touched.

## Phase 0 – System Audit & Foundations (global scope)
- **Design tokens**: Centralize typography scales, color ramps, elevation tokens, and spacing constants inside `app/globals.css` and shared utility files. Align with WCAG AA contrast and provide CSS custom properties for light surfaces, gradients, and semantic states.
- **Grid & breakpoints**: Define a consistent content width (`max-w-6xl` marketing, `max-w-7xl` app shell) and mobile-first breakpoint rules. Guarantee every layout gracefully collapses to single-column stacks with generous tap targets (44px+).
- **Typography**: Introduce a sans-serif display + humanist text pairing using system fonts until fonts can be loaded. Establish heading, subhead, body, caption scales and reuse across pages.
- **Iconography**: Adopt Lucide or existing inline SVG icons with consistent sizing (20/24px). Expose a helper `<IconBadge>` component for tinted icon containers.
- **Interactive states**: Standardize hover/focus/active states, drop shadows, and transitions through utility classes or shared Tailwind variants. Add `focus-visible` rings everywhere.
- **Testing cadence**: After each page update run `npm run lint` (and relevant feature specs when touching functionality) to confirm no regressions.

## Phase 1 – Global Shell & Navigation (`app/layout.tsx`, `app/components/ui/*`, `app/components/providers.tsx`)
1. **Skip link + reduced-motion**: Add a `Skip to main content` anchor and respect `prefers-reduced-motion` in animations.
2. **App chrome**: Build a responsive header component with brand lockup, Tenant switcher shortcut, NotificationBell, and UserMenu; ensure it is reused on every authenticated page.
3. **Footers**: Introduce a simple marketing footer for unauthenticated views and a slim status footer for dashboards showing environment, build number, or support links.
4. **Surface backgrounds**: Replace ad-hoc gradients with a tokenized palette and ensure backgrounds adapt to dark/light expansions.

## Phase 2 – Landing & Marketing (`app/components/landing/LandingPage.tsx`)
1. **Hero rewrite**: Two-column layout with narrative copy on left and illustrative mosaic or testimonial card on right. Keep search + CTA below hero, ensure inputs have inline validation hints.
2. **Search module**: Expand search card with autopill filters (Creed, City, Support groups) and show trending queries; mobile layout uses accordion to conserve space.
3. **Social proof**: Add testimonial carousel + logos row referencing `app/public` assets or placeholder badges. Include accessible `aria-live` for rotating quotes.
4. **Journey timeline**: Convert journey cards into a timeline with numbered markers and optional imagery for each stage.
5. **Footer CTA**: End with dual CTAs (Create a tenant, Log in) and highlight compliance & security badges.

## Phase 3 – Authentication Flows (`app/auth/*`, `app/components/auth/*`)
1. **Layout**: Shared auth layout with split gradient background and card for forms. Support dark overlay image column for desktop.
2. **Form ergonomics**: Larger inputs, floating labels, inline password strength indicators, and error summaries that map to server validations.
3. **Social login region**: Buttons with provider icons, loading spinners, and accessible descriptions.
4. **Progress breadcrumbs**: Display where the user is in onboarding (Create account → Verify email → Complete profile).

## Phase 4 – Home Dashboard (`app/page.tsx`, `app/components/HomePageClient.tsx`, `app/components/tenant/*`)
1. **Command center grid**: Introduce a masonry layout for quick metrics, pending approvals, event snapshots, and donation summaries.
2. **Quick actions**: Convert the current buttons into cards with icons, descriptions, and optional badges showing counts.
3. **Tenant selector**: Expand to include tenant avatars, roles, and status tags. Provide keyboard navigation and progressive loading states.
4. **Responsive behavior**: Collapse grid into single-column stack on small screens with sticky quick action nav.

## Phase 5 – Explore & Discovery (`app/explore/*`, `app/components/explore/*`)
1. **Filters drawer**: Sticky left rail on desktop and slide-over drawer on mobile with facets for creed, city, language, programs, donation needs.
2. **Result cards**: Rich cards with hero image, key stats, CTA buttons (“Preview profile”, “Request membership”). Use skeleton loaders while data fetches.
3. **Map snippet**: Optional mini-map or location tags using existing data fields.
4. **Empty states**: Provide suggestion pills when no tenants match filters.

## Phase 6 – Tenant Detail & Creation (`app/tenants/*`, `app/components/tenant/*`)
1. **Header banner**: Responsive cover photo with overlay gradient, tenant avatar, and primary CTA group.
2. **Tab navigation**: Sticky tabs for Overview, Events, Messaging, Donations, and Teams. Keep underlying routes intact by sharing the same slug.
3. **Content sections**: Introduce cards for beliefs, leadership, schedules, donation links, and volunteer needs with icons and progress bars.
4. **Creation wizard**: Multi-step form with progress tracker, autosave states, and contextual help.

## Phase 7 – Account & Admin Panels (`app/account/*`, `app/admin/*`, `app/components/account/*`, `app/components/admin/*`)
1. **Two-pane layout**: Sidebar nav on desktop, sheet-based nav on mobile. Active section indicator + descriptive tooltips.
2. **Form standardization**: Use shared `<FormField>` components with consistent spacing, help text, and validation icons.
3. **Data visualization**: Inline charts or spark lines for donations, engagement, and approvals using lightweight SVG.
4. **Audit logs**: Table enhancements (sticky headers, zebra rows, responsive stacking, empty-state illustrations).

## Phase 8 – Messaging & Notifications (`app/messages/*`, `app/components/messages/*`, `app/notifications/*`)
1. **Split panel messaging**: Thread list, conversation view, and member info drawer. Support responsive collapse to conversation-first layout.
2. **Composer upgrades**: Rich text toolbar, emoji picker, attachment previews, and send/loading states.
3. **Notification center**: Timeline view grouped by day with quick actions (mark read, jump to context). Provide filters for type/tenant.

## Phase 9 – Profile & Community Surfaces (`app/profile/*`, `app/components/profile/*`)
1. **Profile header**: Cover image, avatar, pronouns, and role chips. Add CTA row (Edit profile, Share link).
2. **Activity feed**: Cards summarizing recent donations, events, and messages with icons.
3. **Preferences**: Accordion for notification/email/visibility settings with toggles.

## Phase 10 – Error, Loading, and Empty States (`app/loading.tsx`, `app/error.tsx`, feature-level placeholders)
1. **Unified skeletons**: Build skeleton components for cards, tables, and forms to avoid layout shifts.
2. **Error boundary UI**: Friendly message with retry button, status illustration, and log reference ID.
3. **Empty-state kit**: Reusable component with icon, title, guidance, and CTA link; use across Explore, Messages, Tenants, etc.

## Phase 11 – Accessibility & Performance Enhancements (cross-cutting)
- Ensure every interactive element has `aria-label`s or descriptive text.
- Provide keyboard traps only where necessary and label form sections with `<fieldset>` and `<legend>`.
- Defer non-critical images with `loading="lazy"` and provide `sizes` attributes for responsive imagery.
- Audit Lighthouse/AXE for each route and track scores inside this document.
- Maintain `prefers-reduced-motion` alternatives for parallax or animated backgrounds.

## Execution Strategy
1. **Document-first**: Before touching code on a page, log the intended change in this file (status column) and cross-reference commits.
2. **Page-by-page delivery**: Finish all tasks for a page before moving on. Each page update includes design adjustments, responsive verification, and lint/test pass.
3. **Validation**: Run `npm run lint` after each batch of updates and smoke-test the route locally to ensure forms, navigation, and backend calls still succeed.
4. **Tracking**: Use the checklist below to mark progress.

| Phase | Scope | Status | Notes |
| --- | --- | --- | --- |
| 0 | System audit | 🔄 In progress | Establishing tokens as pages are modernized |
| 1 | Global shell | ⏳ Pending | Header/footer updates planned after marketing polish |
| 2 | Landing page | 🔄 In progress | Hero + testimonial upgrades underway |
| 3 | Auth flows | ⏳ Pending | Awaiting design kit |
| 4 | Home dashboard | ⏳ Pending | | 
| 5 | Explore & discovery | ⏳ Pending | |
| 6 | Tenant detail & creation | ⏳ Pending | |
| 7 | Account & admin | ⏳ Pending | |
| 8 | Messaging & notifications | ⏳ Pending | |
| 9 | Profile | ⏳ Pending | |
| 10 | Error/loading/empty states | ⏳ Pending | |
| 11 | Accessibility & performance | 🔄 Continuous | AXE + Lighthouse per route |

## Current Focus
- Apply Phase 2 hero/search refinements in `app/components/landing/LandingPage.tsx`.
- Validate no backend behavior changes and record lint/test results per change set.
