# FLOXA WORK — PHASE 15 ACCESSIBILITY (a11y) SPECIFICATION

**Standard:** WCAG 2.1 Level AA Compliance  
**Focus:** Semantic HTML, High Contrast Ratios, Screen Reader Support, and Keyboard Operability  

---

## 1. Core Accessibility Principles

### 1.1 Contrast Ratios
- **Body Text:** `#0F172A` on `#FFFFFF` / `#F5F8FC` provides a contrast ratio exceeding **12.5:1** (exceeding WCAG AAA requirement of 7:1).
- **Secondary Text:** `#64748B` on `#FFFFFF` provides a contrast ratio of **4.8:1** (exceeding WCAG AA requirement of 4.5:1).
- **Brand Buttons:** `#0084FF` with white text provides sharp visual clarity backed by font-extrabold styling.
- **Status Indicators:** Success (`#10B981`), Warning (`#F59E0B`), and Danger (`#EF4444`) are reinforced with explicit icon indicators (`CheckCircle2`, `AlertTriangle`, `X`, `ShieldCheck`) to ensure color-blind users are never dependent on hue alone.

### 1.2 Keyboard Navigation & Focus Rings
- All interactive controls (`button`, `a`, `input`, `textarea`, `select`) feature distinct focus indicators:
  - Cyan-tinted rings (`focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20`) provide clear visual feedback during tab navigation.
  - Modals support `Escape` key listeners to dismiss overlays without mouse clicks.
  - Form submission buttons are explicitly bound to form submit handlers, supporting Enter key activation.

### 1.3 ARIA Roles & Screen Reader Annotations
- **Modals:** Decorated with `role="dialog"`, `aria-modal="true"`, and descriptive headings (`h3`).
- **Toasts & Live Updates:** Decorated with `role="alert"` and `aria-live="polite"` so screen readers announce notifications dynamically.
- **Icon-Only Buttons:** Decorated with descriptive `aria-label` or `title` attributes (e.g. `aria-label="Close modal"`, `aria-label="Dismiss notification"`).
- **Tab Lists:** Semantic tab strips with active selection states clearly identified.

### 1.4 Form Usability & Error Feedback
- Every input field includes a descriptive `<label>` and real-time character counters.
- Validation errors are presented inline with clear explanatory messages and iconography rather than blocking modal alerts.
