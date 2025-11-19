
# Temple Platform - UI/UX Design Specification & Style Guide

**Version:** 1.0
**Target Audience:** Frontend Engineers, AI Coding Assistants (Copilot, Codex)
**Tech Stack:** React, Tailwind CSS

---

## 1. Design Philosophy: "Modern Sanctuary"

The design aesthetic should be **warm, welcoming, and trustworthy**, yet **clean and structurally modern**. It should feel like a premium SaaS product (like Linear or Airbnb) adapted for community/faith organizations.

*   **Core Attributes:** Clean, Breathable, Organized, Warm.
*   **The "1990s" Avoidance Strategy:**
    *   No default browser fonts (Times New Roman).
    *   No bevels or harsh borders.
    *   Generous padding (whitespace is luxury).
    *   Soft, diffused shadows instead of solid outlines.
    *   Subtle transitions on hover states.

---

## 2. Global Design Tokens (Tailwind Config)

### 2.1 Color Palette
We use **Amber** as the primary brand color to evoke warmth/light, paired with **Slate** for a modern, softer neutral than pure gray.

*   **Primary (Brand):** Amber-600 (`bg-amber-600`, `text-amber-600`) for main actions.
    *   *Hover:* Amber-700
    *   *Light/Background:* Amber-50 (`bg-amber-50`)
*   **Neutrals (Text & UI):**
    *   *Headings:* Slate-900
    *   *Body Text:* Slate-600
    *   *Muted/Meta:* Slate-400
    *   *Borders:* Slate-200
    *   *Backgrounds:* White (`bg-white`) and Slate-50 (`bg-slate-50`) for page backgrounds.
*   **Semantic:**
    *   *Destructive:* Rose-600
    *   *Success:* Emerald-600
    *   *Info/Links:* Sky-600

### 2.2 Typography
*   **Font Family:** `Inter` (Sans-Serif). It must be applied globally to the `body`.
*   **Headings:** Bold (`font-bold`), tight tracking (`tracking-tight`).
    *   H1: `text-3xl md:text-4xl font-bold text-slate-900 tracking-tight`
    *   H2: `text-2xl font-semibold text-slate-900`
    *   H3: `text-lg font-semibold text-slate-900`
*   **Body:** `text-sm` or `text-base`, `leading-relaxed` for readability.

### 2.3 Structure & Shape
*   **Border Radius:** Use `rounded-lg` (0.5rem) for inputs/buttons and `rounded-xl` (0.75rem) for cards/modals.
*   **Shadows:**
    *   Cards: `shadow-sm hover:shadow-md transition-shadow duration-200`
    *   Dropdowns/Modals: `shadow-xl`
*   **Spacing:**
    *   Page Padding: `px-4 sm:px-6 lg:px-8`
    *   Section Spacing: `space-y-6` or `space-y-8`

---

## 3. Component Specifications

### 3.1 Buttons (`Button.tsx`)
*   **Base:** `inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`
*   **Primary:** `bg-amber-600 text-white hover:bg-amber-700`
*   **Secondary:** `bg-white border-slate-300 text-slate-700 hover:bg-slate-50`
*   **Ghost/Text:** `bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-none`
*   **Danger:** `bg-rose-600 text-white hover:bg-rose-700`

### 3.2 Cards (`Card.tsx`)
*   **Container:** `bg-white overflow-hidden rounded-xl border border-slate-200 shadow-sm`
*   **Header:** `px-6 py-5 border-b border-slate-100`
*   **Body:** `p-6`
*   **Footer:** `bg-slate-50 px-6 py-4 border-t border-slate-100`

### 3.3 Inputs & Forms (`Input.tsx`)
*   **Label:** `block text-sm font-medium text-slate-700 mb-1.5`
*   **Input Field:** `appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-colors`
*   **Select:** Same styles as Input.

### 3.4 Navigation (`TenantLayout.tsx` Header)
*   **Container:** `bg-white border-b border-slate-200 sticky top-0 z-50`
*   **Links:** `text-sm font-medium text-slate-500 hover:text-slate-900 px-3 py-2 rounded-md transition-colors`
*   **Active Link:** `text-amber-600 bg-amber-50`

---

## 4. Page-Specific Guidelines

### 4.1 Landing Page (`LandingPage.tsx`)
*   **Hero Section:** Needs a large, centered layout.
*   **Headline:** Huge typography (`text-5xl md:text-7xl`), use a gradient text effect on "Temple" (`bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-500`).
*   **Search Bar:** Oversized (`h-14`), fully rounded (`rounded-full`), deep shadow (`shadow-lg`).
*   **Background:** Use a subtle pattern or gradient (e.g., `bg-gradient-to-b from-amber-50 to-white`) to avoid looking plain.

### 4.2 Explore / Search Results (`ExplorePage.tsx`)
*   **Grid:** Responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).
*   **Tenant Cards:**
    *   Banner image aspect ratio: `aspect-w-16 aspect-h-9` (or `h-48`).
    *   Logo should overlap the banner: absolute position, `-bottom-6 left-4`, with a white ring (`ring-4 ring-white`).
    *   Typography: Title in bold slate-900, creed in amber-600, location in slate-500.

### 4.3 Tenant Dashboard (`HomePage.tsx`)
*   **Header:** Same Banner/Logo overlap style as Explore cards, but larger.
*   **Quick Stats/Info:** Use a grid of Cards for "Welcome", "Next Event", "Recent Post".
*   **Live Stream Indicator:** Pulsing animation (`animate-pulse`) on a red badge.

### 4.4 Messaging (`MessagesPage.tsx` & `ChatPage.tsx`)
*   **Layout:** Two-column layout. Fixed height (`h-[calc(100vh-4rem)]`).
*   **Sidebar (Conversation List):**
    *   `border-r border-slate-200 bg-white w-80 flex-shrink-0`.
    *   Active item: `bg-amber-50 border-l-4 border-amber-600`.
    *   Avatars: `rounded-full h-10 w-10 object-cover`.
*   **Message Area:**
    *   Background: `bg-slate-50`.
    *   **Bubbles (Self):** `bg-amber-600 text-white rounded-2xl rounded-tr-none`.
    *   **Bubbles (Others):** `bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-none shadow-sm`.
    *   **Input Area:** Fixed at bottom, white background, border-top. Input should be `rounded-full`.

### 4.5 Calendar (`EventsPage.tsx`)
*   **Grid:** Use CSS Grid. Headers (Mon-Sun) should be uppercase, text-xs, font-bold, text-slate-400.
*   **Cells:** `min-h-[120px] border border-slate-100 p-2`.
*   **Event Chips:** `text-xs px-2 py-1 rounded-md truncate bg-amber-100 text-amber-800 border border-amber-200`.

### 4.6 Admin Control Panel (`ControlPanel.tsx`)
*   **Tabs:** Horizontal scrollable tabs.
    *   Active: `border-b-2 border-amber-500 text-amber-600`.
    *   Inactive: `text-slate-500 hover:text-slate-700`.
*   **Tables (Member List/Audit Log):**
    *   Header: `bg-slate-50 text-xs uppercase tracking-wider font-semibold text-slate-500`.
    *   Rows: `border-b border-slate-100 hover:bg-slate-50 transition-colors`.
    *   Cells: `py-4 px-6 text-sm text-slate-600`.

---

## 5. Accessibility Checklist for AI
*   **Contrast:** Ensure Slate-400 text is not used for essential reading (too light). Use Slate-500 or 600.
*   **Focus States:** All interactive elements must have `focus-visible:ring-2 focus-visible:ring-amber-500`.
*   **Semantic HTML:** Use `<nav>`, `<main>`, `<header>`, `<article>`, `<section>` appropriately.

## 6. Specific Fixes for "1990s" Look
1.  **Remove Default Borders:** Ensure tables don't have the double-border default. Use `border-collapse`.
2.  **Fix Heights:** Ensure the main app container uses `min-h-screen` and `flex flex-col` so footers don't float awkwardly.
3.  **Image Object Fit:** Always add `object-cover` to images inside containers to prevent squishing.
4.  **Empty States:** Never leave a blank white space. Use a light gray rounded container with a centered icon and text for "No results found".
