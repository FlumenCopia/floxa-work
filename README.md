# FLOXA Work — A Discovery-First Freelance Marketplace

> **Phase 2 | Target Launch: Q4 2026**  
> *"Where projects start with clarity, not guesswork. Consultants bid with a Mini-Discovery, and escrow protects both sides."*

---

## 1. Executive Summary & Philosophy

Existing freelance platforms (Upwork, Fiverr, Freelancer) suffer from a fundamental breakdown:
- **Clients don't know how to write actionable briefs**, leading to vague 2-line descriptions.
- **Freelancers blast generic AI/copy-paste proposals**, competing in a race to the bottom.
- **Scope creep, misaligned expectations, and disputes** ruin projects before milestone 1 is even delivered.

**FLOXA Work flips this model on its head by adopting the proven discovery-first DNA of FLOXA Design:**
1. **Guided Client Briefing:** Clients post briefs using structured Discovery Frames (objectives, audience, deliverables, anti-goals, budget, deadline).
2. **The Mini-Discovery Pitch (Core Differentiator):** Freelancers and agencies do NOT submit text cover letters. They submit an interactive **Mini-Discovery** (3-4 diagnostic questions answered, initial problem hypothesis, milestone breakdown, and preliminary visual/technical direction).
3. **Smart Milestone Escrow:** Funds are deposited upfront into milestone escrow and released only upon structured deliverable sign-off.
4. **The "FLOXA Bridge":** When a bid is accepted, the project can automatically provision a dedicated project workspace in **FLOXA Design** (branding/creative), **FLOXA IT** (development), or **FLOXA DM** (marketing), unlocking deep collaborative delivery.

---

## 2. Parallels & Shared Architecture with FLOXA Design

| FLOXA Design Feature | FLOXA Work Adaptation |
| :--- | :--- |
| **Discovery Frames & Sliders** | **Guided Brief Builder & Mini-Discovery Pitch:** Both client briefs and consultant bids use interactive sliders (e.g. Speed vs. Craft, Budget vs. Scope, Minimalist vs. Bold) and structured requirement cards. |
| **Brand DNA Generation** | **Project DNA & Scoping Specification:** AI-synthesized contract and scope document generated instantly from the accepted mini-discovery. |
| **Token-Based Client Portal** | **Frictionless Client Experience:** Clients can manage proposals, chat with bidders, and approve milestones via secure Magic Links without forced registration walls. |
| **Agreements & Signatures** | **Standardized Master Services Agreement (MSA) + Milestone Contract:** Legally binding auto-generated agreements with e-signatures prior to escrow funding. |
| **Deliverables & Review Cycles** | **Versioned Milestone Approvals:** Deliverable preview, annotation, revision request counters, and explicit sign-offs before escrow funds disburse. |
| **Realtime WebRTC & Support WS** | **Bid Interview Rooms & Milestone Collaboration:** Peer-to-peer video/audio interview calls and real-time chat between clients and consultants. |

---

## 3. Core Modules & Technical Specifications

```text
floxa-work/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Brief.model.ts              # Client brief & discovery criteria
│   │   │   ├── Proposal.model.ts           # Mini-Discovery pitch & bid structure
│   │   │   ├── EscrowContract.model.ts     # Escrow transaction & milestone ledger
│   │   │   ├── ReviewDispute.model.ts      # Structured dispute arbitration
│   │   │   └── TalentProfile.model.ts      # Consultant portfolio & verified DNA badges
│   │   ├── services/
│   │   │   ├── escrow.service.ts           # Payment gateway integration (Stripe/Razorpay escrow)
│   │   │   ├── aiMatching.service.ts       # Brief-to-consultant semantic matching
│   │   │   └── floxaBridge.service.ts      # Workspace provisioner across FLOXA apps
│   │   └── websocket/                      # Live proposal updates & WebRTC interview signaling
└── frontend/
    ├── app/
    │   ├── briefs/                         # Brief explore, details, and submission
    │   ├── proposals/                      # Interactive Mini-Discovery proposal builder
    │   ├── escrow/                         # Milestone fund locking & payout dashboard
    │   └── client/[token]/                 # Magic-link client proposal review & hiring portal
    └── components/
        ├── mini-discovery/                 # Reusable slider, frame, and diagnostic pitch cards
        └── milestone-tracker/              # Visual step-by-step escrow release tracker
```

---

## 4. The 5-Step Workflow

1. **Post Brief:** Client answers a 4-step guided intake (Problem, Audience, Deliverables, Budget/Timeline).
2. **Mini-Discovery Bidding:** Qualified consultants submit an interactive pitch showing their diagnosis of the client's problem.
3. **Interview & Lock:** Client reviews visual/strategic pitch cards, conducts a 1-click WebRTC audio/video call, and selects the winner.
4. **Escrow Funding:** Client deposits Milestone 1 into escrow. FLOXA generates the mutual digital agreement.
5. **Execution & Release:** Work is tracked via deliverables. Client reviews and clicks "Approve & Release Funds", with direct export into the wider FLOXA suite.

