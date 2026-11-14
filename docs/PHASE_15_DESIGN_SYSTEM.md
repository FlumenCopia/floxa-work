# FLOXA WORK — PHASE 15 DESIGN SYSTEM SPECIFICATION

**Version:** 2.0 (Phase 15 Production Polish)  
**Target:** Clean, Authoritative, High-Contrast Marketplace Interface  
**Design Philosophy:** Discovery-First, Content-Focused, Transparent, Accessible  

---

## 1. Color Palette & Semantic Tokens

FLOXA Work utilizes an executive palette combining deep slate neutrals with high-clarity cobalt/cyan brand accents and precise semantic indicators:

### 1.1 Brand & Action Accents
- **Primary Brand (`--primary`):** `#0084FF` — Primary buttons, active tabs, brand focus rings.
- **Primary Hover (`--primary-hover`):** `#0070E0` — Interactive hover states.
- **Primary Subtle (`--primary-subtle`):** `#EFF6FF` — Light active indicator backgrounds.
- **Primary Border (`--primary-border`):** `#BFDBFE` — Outlines on active items.

### 1.2 Surface & Structural Neutrals
- **Canvas Backdrop (`--bg-subtle`):** `#F5F8FC` — Main app canvas with subtle gradient overlays.
- **Card Surface (`--surface`):** `#FFFFFF` — Primary elevated content cards.
- **Card Border (`--border`):** `#E2E8F0` — Subtle dividing lines and borders.
- **Text Primary (`--navy`):** `#0F172A` — Headings, high-importance labels, primary typography.
- **Text Secondary (`--secondary`):** `#64748B` — Subheadings, explanatory descriptions.
- **Text Muted (`--muted`):** `#94A3B8` — Metadata, timestamps, helper hints.

### 1.3 Semantic Feedback Indicators
- **Success (`--success`):** `#10B981` (Bg: `#ECFDF5`, Border: `#A7F3D0`) — Milestones approved, contracts initialized, payments confirmed.
- **Warning (`--warning`):** `#F59E0B` (Bg: `#FFFBEB`, Border: `#FDE68A`) — Revision requested, action required, deadline approaching.
- **Danger (`--danger`):** `#EF4444` (Bg: `#FEF2F2`, Border: `#FECACA`) — Disputes opened, errors, contract cancellation.
- **Info (`--info`):** `#0284C7` (Bg: `#E0F2FE`, Border: `#BAE6FD`) — External settlement notices, non-custodial disclosures.

---

## 2. Typography Scale

Typography is powered by `Inter`, optimized for readability in data-dense marketplace tables and proposal comparison grids:

| Token | Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `display-lg` | 28px (1.75rem) | 36px | 800 (Bold) | Dashboard hero titles, section headers |
| `display-md` | 20px (1.25rem) | 28px | 700 (Bold) | Card headings, proposal modal headers |
| `body-lg` | 15px (0.9375rem) | 24px | 600 (Semibold) | Primary callout labels, navigation text |
| `body-base` | 13.5px (0.843rem) | 20px | 400 / 500 | Main body text, diagnosis explanations |
| `body-sm` | 12px (0.75rem) | 16px | 500 / 600 | Metadata, helper texts, table cells |
| `caption` | 10.5px (0.656rem) | 14px | 700 (Extrabold) | Uppercase badges, category tags |

---

## 3. Elevation, Spacing & Borders

### 3.1 Elevation Tokens
- **Subtle Surface:** `shadow-2xs` / `shadow-xs` — Proposal cards, list items.
- **Elevated Card:** `shadow-[0_4px_20px_rgba(0,0,0,0.04)]` — Dashboard containers.
- **Modal Overlay:** `shadow-[0_24px_70px_rgba(0,132,255,0.18)]` — Confirmation & brief modals.

### 3.2 Spacing & Radii
- **Standard Card Radius:** `rounded-2xl` (`16px`)
- **Pill Button Radius:** `rounded-full` (`9999px`)
- **Modal Container Radius:** `rounded-3xl` (`24px`)
- **Base Grid Spacing:** Increments of 4px (`p-2`, `p-3`, `p-4`, `p-6`).

---

## 4. Component Standards

### 4.1 Buttons
- **Primary Action (`.btn-cyan-pill`):**
  - High-visibility `#0084FF` background with white text, bold tracking, pill shape, subtle hover elevation.
- **Secondary Action (`.btn-dark-pill`):**
  - `#0F172A` navy background with white text, optimized for interviews, calls, and technical actions.
- **Outline Action:**
  - White background, `#E2E8F0` border, `#64748B` text, hover `#0F172A`.

### 4.2 Interactive Badges & Status Indicators
- **Non-Custodial External Payment Pill:**
  - Deep blue background with `#0084FF` text and padlock/shield icon, clearly indicating zero platform fund custody.
- **Milestone Progress Pill:**
  - Dual status displaying deliverable condition (e.g., "Draft Submitted") alongside settlement condition ("Pending Direct Settlement").
- **Verification Badge:**
  - Emerald badge with checkmark indicating verified identity and portfolio proof.

### 4.3 Confirmation Modals
- Modal windows must include:
  1. Backdrop with blur (`bg-slate-900/60 backdrop-blur-md`).
  2. Clear category eyebrow and bold title.
  3. Actionable term review summary.
  4. Explicit secondary ("Cancel") and primary ("Confirm") buttons.
  5. Loading state animations preventing double-clicks.

