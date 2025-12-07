# UI/UX Fix Implementation Plan

**Project:** Asembli Platform (Temple4)  
**Plan Created:** December 6, 2025  
**Round 3 Updated:** December 7, 2025  
**Reference Document:** `uiprob.md`

---

## Round 2 Summary

Round 2 successfully addressed **all 14 new issues**, focusing on dark mode theming and accessibility:
- ✅ Fixed Input component error states (NEW-1)
- ✅ Fixed Card component dark mode (NEW-2)
- ✅ Implemented focus-visible for Buttons (NEW-3)
- ✅ Fixed NotificationPanel theming (NEW-12)
- ✅ Added accessibility attributes to Auth forms (NEW-13)
- ✅ Cleaned up hardcoded colors across Tenant pages (NEW-6 to NEW-11)

---

## Round 3 Goals

### Design Principles (Refined)
1.  **Strict Semantic Tokens**: Stop relying on the global CSS hacks in `globals.css`. Use `text-foreground`, `bg-muted` explicitly.
2.  **Component Modularity**: Break down overly complex components (`SiteHeader`) to improve maintainability.
3.  **Clean Code**: Remove inline styles and use Tailwind utilities exclusively.

### Target UX (Round 3)
-   Seamless dark mode in complex components (TenantSelector, MobileNav).
-   Improved maintainability for the header system.
-   Higher polish on mobile interaction states.

---

## Round 3 Per-Issue Fix Plan

---

### Fix R3-1: Refactor SiteHeader (Complexity)

**Reference:** `uiprob.md` R3-1 (and Old Issue #9)
**Problem:** `SiteHeader.tsx` contains `TenantMenuPlaceholder` (500+ lines).

#### Implementation Steps
1.  **Create new file `app/components/ui/TenantMenu.tsx`**:
    -   Extract the `TenantMenuPlaceholder` component logic and markup.
    -   Import necessary dependencies (`usePathname`, `useSession`, etc.).
2.  **Update `SiteHeader.tsx`**:
    -   Import `TenantMenu` (rename from Placeholder to real name).
    -   Replace the inline definition with the import.

#### Files to Modify
-   [NEW] `app/components/ui/TenantMenu.tsx`
-   `app/components/ui/SiteHeader.tsx`

---

### Fix R3-2: TenantSelector Dark Mode & Polish

**Reference:** `uiprob.md` R3-2
**Problem:** Hardcoded slate colors, inline styles.

#### Implementation Steps
1.  **Update `TenantSelector.tsx`**:
    -   Replace `text-slate-900` -> `text-foreground`
    -   Replace `text-slate-500` -> `text-muted-foreground`
    -   Replace `border-slate-200` -> `border-border`
    -   Replace `bg-white` -> `bg-card`
    -   Replace `style={{ WebkitLineClamp: 2... }}` with `class="line-clamp-2"`
    -   Ensure hover states use semantic vars (`hover:border-primary`).

#### Files to Modify
-   `app/components/tenant/TenantSelector.tsx`

---

### Fix R3-3: MobileNav Theming

**Reference:** `uiprob.md` R3-3
**Problem:** Hardcoded gray colors.

#### Implementation Steps
1.  **Update `MobileNav.tsx`**:
    -   Replace `text-gray-700` -> `text-foreground` / `text-muted-foreground`
    -   Replace `hover:bg-gray-50` -> `hover:bg-muted`
    -   Replace `bg-gray-50/50` -> `bg-muted/50`
    -   Ensure standard border colors are used.

#### Files to Modify
-   `app/components/ui/MobileNav.tsx`

---

## Round 3 Execution Order

1.  **R3-1**: Refactor SiteHeader (High impact on architecture).
2.  **R3-2**: TenantSelector Polish (Visual fix).
3.  **R3-3**: MobileNav Theming (Visual fix).
4.  **Verification**: Build and standard manual checks.

---

## Remaining Tech Debt (Future)

-   Global CSS overrides in `globals.css` (Requires full audit to remove).
-   Native `<img>` usage in some Tenant components.

---

*Round 3 Plan Complete - December 7, 2025*
