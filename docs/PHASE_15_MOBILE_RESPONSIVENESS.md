# FLOXA WORK — PHASE 15 MOBILE RESPONSIVENESS SPECIFICATION

**Target Viewports:** 360px (Small Mobile) through 1440px+ (Ultra-Wide Desktop)  
**Layout Model:** Fluid CSS Grid + Flexbox with Tailored Tailwind Breakpoints  

---

## 1. Viewport Breakpoint Standards

FLOXA Work is engineered to ensure seamless readability and interaction across all modern device classes:

| Breakpoint | Width (px) | Device Archetype | Layout Paradigm |
| :--- | :--- | :--- | :--- |
| **`xs` (Mobile Small)** | 360px – 420px | iPhone SE, Galaxy S21/S24 | Single-column cards, collapsible mobile drawer, touch targets ≥ 44px |
| **`sm` (Mobile Large)** | 420px – 640px | iPhone 15 Pro Max, Pixel 8 | Full-width pill tabs with scrollbar snapping, responsive action rows |
| **`md` (Tablet Portrait)** | 768px – 1024px | iPad, Surface Go | 2-column KPI grid, side navigation collapses to sticky bottom bar |
| **`lg` (Desktop Base)** | 1024px – 1280px | MacBook Air, 1080p Display | 4-column KPI grid, 260px fixed sidebar, multi-column comparison table |
| **`xl` (Widescreen)** | 1440px+ | 2K / 4K Monitors | Centered content container (max-w-7xl), full 4-column side-by-side matrices |

---

## 2. Responsive UI Components

### 2.1 Navigation & Shell (`FloxaWorkShell.tsx`)
- On desktop (≥1024px), a fixed 260px left sidebar provides persistent access to all platform views.
- On mobile (<1024px), the sidebar transitions into a fixed bottom navigation bar with high-contrast icon badges and active tab indicators.
- Horizontal navigation strips (such as category filters and proposal comparison selectors) employ `overflow-x-auto` with `scrollbar-none` to allow smooth touch swiping without vertical layout shifting.

### 2.2 Proposal Comparison Engine (`ProposalComparisonEngine.tsx`)
- On widescreen displays, up to 4 candidate proposals are arranged side-by-side in a comparative matrix.
- On mobile screens (<768px), the comparison view provides a carousel/switcher allowing clients to compare candidates via quick horizontal toggles while retaining sticky header metrics.

### 2.3 Post Brief Modal & Acceptance Modals
- All modal dialogs are centered with responsive margins (`p-3 sm:p-4`), clamped to maximum heights (`max-h-[92vh]`), and provide internal `overflow-y-auto` scrolling. This guarantees that mobile keyboards do not obscure action buttons or input fields.

