# UI/UX Fix Implementation Plan

**Project:** Asembli Platform (Temple4)  
**Plan Created:** December 6, 2025  
**Round 2 Updated:** December 6, 2025  
**Reference Document:** `uiprob.md`

---

## Round 1 Summary

Round 1 successfully addressed **16 of 27 issues (59%)**, including all 3 high-priority security/critical UX issues:
- ✅ Removed hardcoded login credentials
- ✅ Created custom 404 pages
- ✅ Fixed ARIA roles on notification panel
- ✅ Implemented dark mode toggle
- ✅ Created breadcrumb navigation
- ✅ Added global focus-visible styles
- ✅ Fixed modal mobile responsiveness
- ✅ Created EmptyState component
- ✅ Added 27+ loading.tsx files
- ✅ Created Avatar component with fallback

---

## Round 2 Goals

### Design Principles (Refined)
1. **Dark Mode First** - All components must work in both light and dark modes
2. **CSS Variables Only** - No hardcoded Tailwind color classes for background, text, or border
3. **Accessible by Default** - All form inputs must support error states with proper ARIA
4. **Focus-Visible Over Focus** - Mouse users should not see focus rings on click
5. **Component Consistency** - All UI components should use the same theming approach

### Target UX (Round 2)
- Full dark mode support across all pages and components
- Consistent form validation with proper accessibility
- Polish focus states to be less intrusive for mouse users
- Professional appearance in both light and dark themes

---

## Round 2 Global Changes

### G2.1 Color Replacement Reference

When replacing hardcoded colors, use this mapping:

| Hardcoded Class | CSS Variable Replacement |
|-----------------|-------------------------|
| `bg-white` | `bg-card` or `bg-background` |
| `bg-gray-50` | `bg-muted` or `bg-background` |
| `bg-gray-100` | `bg-muted` |
| `bg-gray-200` | `bg-muted` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-700` | `text-foreground` |
| `text-gray-900` | `text-foreground` |
| `text-slate-900` | `text-foreground` |
| `border-gray-200` | `border-border` |
| `border-gray-300` | `border-border` |
| `divide-gray-200` | `divide-border` |

### G2.2 Focus State Pattern

Replace all `focus:` with `focus-visible:` for ring/outline styles:

```tsx
// Before
focus:ring-2 focus:ring-primary focus:ring-offset-2

// After
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

### G2.3 Input Error State Pattern

All Input components should support:

```tsx
interface InputProps {
  error?: boolean;
  errorMessage?: string;
  id?: string;
}

// When error=true, add:
// - border-destructive
// - aria-invalid="true"
// - aria-describedby={`${id}-error`}
```

---

## Round 2 Per-Issue Fix Plan

---

### Fix R2-1: Input Component Error State (NEW-1)

**Reference:** `uiprob.md` NEW-1  
**Severity:** 🟡 Medium  
**Problem:** Input lacks error state styling and ARIA attributes

#### Implementation Steps

1. **Update Input component** (`app/components/ui/Input.tsx`)
   - Add `error` prop
   - Add `errorMessage` prop for connecting aria-describedby
   - Add conditional border-destructive class
   - Add aria-invalid when error is true
   - Add aria-describedby pointing to error message

#### Files to Modify
- `app/components/ui/Input.tsx`

---

### Fix R2-2: Card Component Dark Mode (NEW-2)

**Reference:** `uiprob.md` NEW-2  
**Severity:** 🟡 Medium  
**Problem:** Card uses hardcoded bg-white and text-slate-900

#### Implementation Steps

1. **Update Card component** (`app/components/ui/Card.tsx`)
   - Replace `bg-white` with `bg-card`
   - Replace `text-slate-900` with `text-card-foreground`
   - Replace any hardcoded border colors

#### Files to Modify
- `app/components/ui/Card.tsx`

---

### Fix R2-3: Button Focus States (NEW-3)

**Reference:** `uiprob.md` NEW-3  
**Severity:** 🟡 Medium  
**Problem:** Button uses focus: instead of focus-visible:

#### Implementation Steps

1. **Update Button component** (`app/components/ui/Button.tsx`)
   - Replace all `focus:` with `focus-visible:`
   - Ensure all variants have proper focus-visible states

#### Files to Modify
- `app/components/ui/Button.tsx`

---

### Fix R2-4: NotificationPanel Dark Mode (NEW-12)

**Reference:** `uiprob.md` NEW-12  
**Severity:** 🟡 Medium  
**Problem:** NotificationPanel uses hardcoded light theme colors

#### Implementation Steps

1. **Update NotificationPanel** (`app/components/notifications/NotificationPanel.tsx`)
   - Replace `bg-white` with `bg-card`
   - Replace `border-gray-*` with `border-border`
   - Replace `text-gray-*` with `text-foreground` or `text-muted-foreground`

#### Files to Modify
- `app/components/notifications/NotificationPanel.tsx`

---

### Fix R2-5: Auth Forms Accessibility (NEW-13, Issue #6)

**Reference:** `uiprob.md` NEW-13, Issue #6  
**Severity:** 🟡 Medium  
**Problem:** Auth forms lack aria-describedby and aria-invalid

#### Implementation Steps

1. **Update login page** (`app/auth/login/page.tsx`)
   - Add id to inputs
   - Add aria-invalid when error exists
   - Add aria-describedby pointing to error message
   - Add id to error message

2. **Update register page** (`app/auth/register/page.tsx`)
   - Same as above

3. **Update forgot-password page** (`app/auth/forgot-password/page.tsx`)
   - Same as above

#### Files to Modify
- `app/auth/login/page.tsx`
- `app/auth/register/page.tsx`
- `app/auth/forgot-password/page.tsx`

---

### Fix R2-6: Auth Pages Background Colors (NEW-4, NEW-5)

**Reference:** `uiprob.md` NEW-4, NEW-5  
**Severity:** 🟢 Low  
**Problem:** Auth pages use hardcoded bg-gray-50

#### Implementation Steps

1. **Update register page background** (`app/auth/register/page.tsx`)
   - Replace `bg-gray-50` with `bg-background`

2. **Update forgot-password page background** (`app/auth/forgot-password/page.tsx`)
   - Replace `bg-gray-50` with `bg-background`

#### Files to Modify
- `app/auth/register/page.tsx`
- `app/auth/forgot-password/page.tsx`

---

### Fix R2-7: Tenant Layout Dark Mode (NEW-6)

**Reference:** `uiprob.md` NEW-6  
**Severity:** 🟢 Low  
**Problem:** Tenant layout uses hardcoded bg-gray-100

#### Implementation Steps

1. **Update tenant layout** (`app/tenants/[tenantId]/layout.tsx`)
   - Replace `bg-gray-100` with `bg-muted` or `bg-background`

#### Files to Modify
- `app/tenants/[tenantId]/layout.tsx`

---

### Fix R2-8: TenantFooter Dark Mode (NEW-7)

**Reference:** `uiprob.md` NEW-7  
**Severity:** 🟢 Low  
**Problem:** TenantFooter uses hardcoded colors

#### Implementation Steps

1. **Update TenantFooter** (`app/tenants/[tenantId]/TenantFooter.tsx`)
   - Replace `bg-white` with `bg-card`
   - Replace `border-gray-*` with `border-border`
   - Replace `text-gray-*` with `text-muted-foreground`

#### Files to Modify
- `app/tenants/[tenantId]/TenantFooter.tsx`

---

### Fix R2-9: TenantNav Dark Mode (NEW-8)

**Reference:** `uiprob.md` NEW-8  
**Severity:** 🟢 Low  
**Problem:** TenantNav uses hardcoded text-gray colors

#### Implementation Steps

1. **Update TenantNav** (`app/tenants/[tenantId]/TenantNav.tsx`)
   - Replace `text-gray-500` with `text-muted-foreground`
   - Replace `hover:text-gray-700` with `hover:text-foreground`
   - Replace `hover:border-gray-300` with `hover:border-border`

#### Files to Modify
- `app/tenants/[tenantId]/TenantNav.tsx`

---

### Fix R2-10: AccountSettingsPage Dark Mode (NEW-9)

**Reference:** `uiprob.md` NEW-9  
**Severity:** 🟢 Low  
**Problem:** AccountSettingsPage uses hardcoded text-gray colors

#### Implementation Steps

1. **Update AccountSettingsPage** (`app/components/account/AccountSettingsPage.tsx`)
   - Replace `text-gray-900` with `text-foreground`
   - Replace `text-gray-500` with `text-muted-foreground`

#### Files to Modify
- `app/components/account/AccountSettingsPage.tsx`

---

### Fix R2-11: Tenant Not-Found Dark Mode (NEW-10)

**Reference:** `uiprob.md` NEW-10  
**Severity:** 🟢 Low  
**Problem:** Tenant not-found uses hardcoded bg-gray-100

#### Implementation Steps

1. **Update tenant not-found** (`app/tenants/[tenantId]/not-found.tsx`)
   - Replace `bg-gray-100` with `bg-background`

#### Files to Modify
- `app/tenants/[tenantId]/not-found.tsx`

---

### Fix R2-12: Messages Loading Dark Mode (NEW-11)

**Reference:** `uiprob.md` NEW-11  
**Severity:** 🟢 Low  
**Problem:** Messages loading uses hardcoded colors

#### Implementation Steps

1. **Update messages loading** (`app/messages/loading.tsx`)
   - Replace `border-gray-200` with `border-border`
   - Replace `bg-gray-200` with `bg-muted`

#### Files to Modify
- `app/messages/loading.tsx`

---

### Fix R2-13: App Loading Dark Mode (NEW-14)

**Reference:** `uiprob.md` NEW-14  
**Severity:** 🟢 Low  
**Problem:** Root loading uses hardcoded colors

#### Implementation Steps

1. **Update app loading** (`app/loading.tsx`)
   - Replace `bg-gray-50` with `bg-background`
   - Replace `text-gray-700` with `text-foreground`
   - Replace `text-gray-500` with `text-muted-foreground`

#### Files to Modify
- `app/loading.tsx`

---

## Round 2 Execution Order

Execute fixes in this order to minimize conflicts and dependencies:

### Phase R2-A: Core Components (High Impact)
1. **R2-1** - Input component error state
2. **R2-2** - Card component dark mode
3. **R2-3** - Button focus states

### Phase R2-B: Notification System
4. **R2-4** - NotificationPanel dark mode

### Phase R2-C: Auth System
5. **R2-5** - Auth forms accessibility
6. **R2-6** - Auth pages background colors

### Phase R2-D: Tenant System
7. **R2-7** - Tenant layout dark mode
8. **R2-8** - TenantFooter dark mode
9. **R2-9** - TenantNav dark mode
10. **R2-11** - Tenant not-found dark mode

### Phase R2-E: Account & Loading
11. **R2-10** - AccountSettingsPage dark mode
12. **R2-12** - Messages loading dark mode
13. **R2-13** - App loading dark mode

### Phase R2-F: Validation & Testing
14. Run `npm run build` and fix any errors
15. Manual dark mode testing
16. Accessibility testing with screen reader

---

## Remaining Tech Debt (Future Rounds)

These items from Round 1 remain open and should be addressed in Round 3:

| Issue | Description | Priority |
|-------|-------------|----------|
| #9 | SiteHeader refactoring (745 lines) | Medium |
| #18 | Tab overflow handling | Low |
| #19 | In-page skip navigation | Low |
| #20 | Native img → next/image migration | Low |
| #21 | MobileNav refactoring (383 lines) | Low |

---

*Round 2 Plan Complete - December 6, 2025*
