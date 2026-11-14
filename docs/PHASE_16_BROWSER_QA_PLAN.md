# FLOXA WORK — PHASE 16: BROWSER QA, USER JOURNEY VALIDATION & LAUNCH CANDIDATE PLAN

**Target:** Commercial Beta Launch Candidate Readiness  
**Git Checkpoint:** `4adc2e6` (Confirmed present on `master`)  
**Architecture:** Next.js 16 + React 19 + TypeScript + Express + MongoDB (Lean single-process deployment)  
**Permanent Rule:** **Zero Escrow / Zero Custody** (Direct client-to-freelancer external settlement)  

---

## 1. System Inspection & Health Status

| Component | Target Endpoint | Health Probe Telemetry | Status |
| :--- | :--- | :--- | :--- |
| **Backend API** | `http://localhost:5001` | Liveness: `200 OK` (Uptime: >1400s) | **Online** |
| **Database** | `mongodb://127.0.0.1:27017` | Readiness: `200 OK` (Ping: 1ms, Database: `floxa_work_db`) | **Connected** |
| **Private Vault** | `backend/media/private_vault` | Storage provider status: `online` | **Operational** |
| **Frontend Web** | `http://localhost:3001` | Next.js 16.2 Turbopack: `200 OK` | **Active** |

---

## 2. Major Application Views & Routes

All core application views are integrated into the responsive master shell with role-aware rendering:

1. **Authentication Gate:**
   - Unified login, multi-step registration (Client vs Freelancer), and password reset dispatch.
2. **Client Dashboard (`client_dashboard`):**
   - KPI metrics, proposal review list, side-by-side comparison engine, acceptance confirmation modal, post-brief guided wizard.
3. **Talent Discovery (`discovery`):**
   - 7D explainable matching, keyword search, availability toggles, saved items, and project invitation modal.
4. **Marketplace Briefs Feed (`briefs`):**
   - Category filtering, budget range sliders, and Mini-Discovery structured proposal modal.
5. **Project Collaboration Workspace (`workspace`):**
   - Authoritative milestone schedule, versioned deliverable submissions, client revision requests, deliverable signoff, decoupled external payment reporting (UTR), dispute mediation modal, and dual-party project closeout.
6. **Payment Ledger (`escrow` / `payments`):**
   - Audit trail of external bank/UPI settlements with non-custodial disclosures.
7. **Talent Profile (`profile`):**
   - Identity, bio, categorized skills, hourly rate, availability, and portfolio evidence.
8. **Direct Real-Time Chat (`chat`):**
   - Real-time conversation thread, unread message indicators, and WebRTC discovery call modal.
9. **Admin Operations Portal (`admin`):**
   - Platform analytics, moderation queue, user management, audit logs, and CSV data exports.

---

## 3. Real Browser QA Testing Methodology

We will execute real browser interactions driving Chrome via DevTools and interactive UI validation across both roles:

### 3.1 Client End-to-End Journey
- Register new client account (`client_qa_p16@floxa.test`).
- Create and publish guided brief with deliverables and budget range.
- Discover talent in search and dispatch project invitation.
- Receive competing Mini-Discovery proposals.
- Launch `ProposalComparisonEngine` to evaluate differences side-by-side.
- Open `AcceptanceConfirmationModal`, verify terms, and initialize project contract.
- Enter `WorkspaceView`, review freelancer deliverable submission, request revision, and approve resubmitted deliverable.
- Log external payment report (UTR reference).
- Finalize dual-party closeout and submit verified review.

### 3.2 Freelancer End-to-End Journey
- Register new freelancer account (`freelancer_qa_p16@floxa.test`).
- Configure profile with skills, headline, hourly rate, and portfolio link.
- Find client's brief in marketplace feed.
- Submit structured Mini-Discovery proposal with problem diagnosis and milestones.
- Receive contract acceptance and enter `WorkspaceView`.
- Manage project tasks on Kanban board.
- Upload deliverable package and respond to client revision request.
- Acknowledge receipt of direct external payment.
- Confirm closeout handover and submit verified client review.

---

## 4. Multi-Viewport Responsive Matrix

Test each core view across the following standard viewport widths:
- **360px** (Small mobile: Galaxy S8 / iPhone SE)
- **390px** (Standard mobile: iPhone 14/15)
- **430px** (Large mobile: iPhone 15 Pro Max)
- **768px** (Tablet portrait: iPad Mini)
- **1024px** (Tablet landscape / Laptop: iPad Pro / MacBook)
- **1440px** (Widescreen desktop: 2K Monitor)

Verifying:
- 0 horizontal overflow issues (`document.documentElement.scrollWidth <= window.innerWidth`).
- All buttons and inputs meet touch target minimums (≥ 44×44px on mobile).
- Modals scale gracefully without clipping content or action buttons.
- Sticky navigation bars collapse cleanly between desktop sidebar and mobile bottom drawer.

---

## 5. Accessibility (WCAG 2.1 AA) & Security Audit Plan

- **Keyboard Navigation:** Verify tab order through forms, modals, and tab bars.
- **Focus Rings:** Ensure high-contrast visible focus rings.
- **Screen Reader Readiness:** Verify `role="dialog"`, `aria-modal="true"`, `role="alert"`, and descriptive `aria-label` tags.
- **Security Isolation:**
  - Verify client cannot view or modify unauthorized contracts or proposals.
  - Verify private files reject unauthorized download requests.
  - Verify zero plaintext passwords or secrets in browser logs or network responses.
