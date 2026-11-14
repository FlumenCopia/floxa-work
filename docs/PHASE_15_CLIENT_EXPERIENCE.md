# FLOXA WORK — PHASE 15 CLIENT EXPERIENCE SPECIFICATION

**Target Audience:** Prospective and Active Project Clients  
**Objective:** Effortless, High-Trust Discovery, Evaluation, Contract Awarding, and Workspace Governance  

---

## 1. Journey Architecture

The client experience in FLOXA Work follows a 5-stage progressive flow:

```
[1. Problem Articulation] ──► [2. Discovery & Invitations] ──► [3. Proposal Comparison]
                                                                      │
[5. External Settlement] ◄── [4. Contract & Workspace] ◄──────────────┘
```

---

## 2. Key Polish Enhancements

### 2.1 Guided Discovery Brief Creation (`PostBriefModal.tsx`)
- **Step 1: Scope & Problem Diagnosis:**
  - Mandatory project title (5–100 characters) and structured problem statement (20–1000 characters).
  - Real-time character counter preventing accidental truncated submissions.
  - Category taxonomy (`branding`, `uiux`, `webdev`, `marketing`).
- **Step 2: Strategic Direction & Deliverables:**
  - Interactive Speed/MVP vs. High-Craft alignment slider (0–100%).
  - Comma-delimited deliverable definition ensuring freelancer deliverables match business objectives.
- **Step 3: Milestone Budget & Non-Custodial Education:**
  - Budget boundaries validation (`budgetMax >= budgetMin`).
  - Clear explanation: *"Direct Milestone Settlement: Clients disburse funds directly per milestone upon deliverable signoff. FLOXA Work never holds or escrows user funds."*

### 2.2 Side-by-Side Proposal Evaluation (`ProposalComparisonEngine.tsx`)
- **Diagnostic-First Comparison:**
  - Freelancer problem understanding and strategy are placed front and center, rather than hourly rates.
  - Compare up to 4 candidate proposals simultaneously with dynamic price spread, duration delta, and milestone count comparison pills.
  - Replaced thread-blocking `alert()` calls with inline non-intrusive notification banners.
  - Direct shortlisting (`BookmarkCheck`) and instant video/audio discovery call launch.

### 2.3 Explicit Acceptance Confirmation Modal (`ClientDashboard.tsx`)
- **Before Phase 15:** Clicking "Accept Proposal" immediately triggered contract initialization without an agreement review modal.
- **Phase 15 Enhancement:** An `AcceptanceConfirmationModal` is displayed prior to freezing the contract snapshot:
  1. Candidate summary with verified consultant badge and portfolio evidence.
  2. Total agreed fee and estimated delivery timeline.
  3. Milestone-by-milestone schedule breakdown with individual amounts and delivery days.
  4. Non-Custodial Legal Notice: Explicit acknowledgment that initial advances and milestones are paid directly to the freelancer via external rails (UPI, bank transfer, Stripe, wire).
  5. Action buttons with active spinner state preventing accidental double-initialization.

### 2.4 Collaboration Workspace Governance (`WorkspaceView.tsx`)
- **Deliverable Version Inspection:** View file artifacts, version history, and revision requests.
- **Decoupled Settlement:** Sign off on deliverable satisfaction independently of external bank confirmation.
- **Payment Dispute Mediation:** If an external transfer is disputed, mediation is initiated directly from the workspace with non-custodial disclosures.
