# FLOXA WORK: PRODUCTION MASTER PLAN & ARCHITECTURE SPECIFICATION

> **Document Version:** 1.0.0  
> **Target Release:** Q4 2026 (Phase 2 of the FLOXA Universe)  
> **Platform Type:** Mobile-First Discovery Freelance Marketplace & Social Proof Network  
> **Repository:** `d:\flumenx\floxa univerce\floxa work`

---

## 1. Vision & Core Philosophy

### 1.1 The Challenge in Current Marketplaces
* **Upwork / Fiverr:** Inundated with low-effort bot proposals, arbitrary algorithm bans, race-to-the-bottom hourly pricing, and detached, corporate interfaces.
* **Social Networks (LinkedIn / Twitter / Behance):** Great for discovery, but lack built-in escrow, structured contracts, milestone tracking, and dispute protection. Deals often fall through in DMs or end in non-payment.

### 1.2 The FLOXA Work Solution
**FLOXA Work merges a modern social media discovery experience with a high-trust, discovery-first escrow marketplace:**
1. **100% Self-Sufficient Platform:** Freelancers **do not** need a paid subscription to FLOXA Design, FLOXA DM, or FLOXA IT to use FLOXA Work. It has its own built-in lightweight workspace, contract engine, chat, and deliverable delivery system. (Optional: Users who *do* own FLOXA Design can click *"Export to FLOXA Design"* for advanced brand identity tooling).
2. **Mobile-First & Social Media Feel:** Designed for smartphones first (clean bottom navigation, swipeable pitch cards, vertical proof-of-work reels/carousels, live availability indicators, and instant real-time messaging).
3. **The "Mini-Discovery" Bidding Engine:** Freelancers do not write walls of generic text. They submit an interactive visual pitch answering 3 diagnostic questions, configuring strategic solution sliders, and proposing milestone roadmaps.
4. **Frictionless Client Experience:** Clients can browse the feed, post a brief in 3 minutes, review swipeable proposals, initiate 1-click video interviews, and fund escrow with zero upfront friction or clunky account creation.

---

## 2. Platform Persona & User Journeys

```
               ┌────────────────────────────────────────────────────────┐
               │              THE FLOXA WORK ECOSYSTEM                  │
               └────────────────────────────────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
         ┌─────────────────────┐                         ┌─────────────────────┐
         │     FREELANCER      │                         │       CLIENT        │
         └─────────────────────┘                         └─────────────────────┘
                    │                                               │
        1. Build Social Profile                         1. Post Guided Brief
           (Proof-of-Work Feed)                            (4 Discovery Frames)
                    │                                               │
        2. Browse Briefs Feed                           2. Browse Top Freelancers
           (Filtered by skills)                            (Social Case Studies)
                    │                                               │
        3. Submit "Mini-Discovery"                      3. Review Swipeable Pitches
           (Diagnostic + Sliders)                          (Video call / Chat in app)
                    │                                               │
                    └───────────────────────┬───────────────────────┘
                                            ▼
                           ┌─────────────────────────────────┐
                           │   4. Agreement Signed & Escrow  │
                           │      Funded via Stripe/Razorpay │
                           └─────────────────────────────────┘
                                            │
                                            ▼
                           ┌─────────────────────────────────┐
                           │   5. In-Platform Workspace      │
                           │      (Built-in or FLOXA Bridge) │
                           └─────────────────────────────────┘
                                            │
                                            ▼
                           ┌─────────────────────────────────┐
                           │   6. Deliverable Sign-off &     │
                           │      Instant Escrow Release     │
                           └─────────────────────────────────┘
```

---

## 3. Core Feature Architecture

### 3.1 Module 1: The Social Discovery Feed & Creator Profiles (Mobile-First)
* **Proof-of-Work (PoW) Feed:** Like Behance/Dribbble combined with X/Instagram. Freelancers share completed projects, interactive UI carousels, design teardowns, and video walk-throughs.
* **Consultant Profile Cards:**
  * Live availability pill (*"Available for 1 project this month"*).
  * Verified badges (*Verified Escrow Deliverables*, *On-Time Completion Rate*).
  * Interactive skill tags, minimum project threshold, and direct *"Request a Pitch"* button.
* **Stories / Highlights:** Temporary or pinned 24-hour behind-the-scenes stories showing work-in-progress.

### 3.2 Module 2: The Guided Brief Builder (Client Experience)
* Instead of a blank description, clients fill out a 4-step mobile-responsive wizard:
  1. **Core Problem & Outcome:** What business goal needs solving?
  2. **Target Audience & Tone:** Interactive archetype selection and style sliders.
  3. **Deliverables Checklist:** Pre-defined tags (e.g., Logo Suite, Next.js MVP, SEO Strategy, Figma Design).
  4. **Budget Range & Target Deadline:** Fixed price or milestone budget tiers with escrow explanation.
* **AI Brief Polish (Gemini API):** An optional 1-click button to turn rough client notes into a professional scope-of-work draft.

### 3.3 Module 3: The "Mini-Discovery" Bidding System
* **No Cover Letter Spam:** Bids are capped per brief (e.g., max 10 to 15 proposals per brief) to ensure high quality.
* **The Pitch Anatomy:**
  * **The Diagnostic (3 Key Insights):** The consultant highlights 3 critical considerations or edge cases regarding the brief.
  * **Interactive Sliders:** Proposed strategic positioning (e.g., *Speed vs. Craft*, *Minimal vs. Elaborate*).
  * **Milestone Breakdown:** Proposed phased timeline with exact deliverable definitions and pricing.
  * **Portfolio Evidence:** 2 attached Proof-of-Work items from their FLOXA profile.

### 3.4 Module 4: Standalone Project Workspace (No External Subs Required)
* A dedicated collaborative workspace for each hired contract:
  * **Activity Feed & Realtime Chat:** Built on WebSockets with typing indicators, file attachments, and voice notes.
  * **1-Click WebRTC Calls:** Peer-to-peer audio and video calls directly inside the browser or mobile app.
  * **Milestone & Deliverable Tracker:**
    * Consultant uploads milestone files or links (Figma, GitHub, Staging URLs, ZIPs).
    * Client has a dedicated **Review & Revision** screen with a revision count tracker.
    * One-tap **"Approve & Release Escrow"** button.
  * **Optional FLOXA Suite Bridge:** For freelancers who *do* subscribe to FLOXA Design, IT, or DM, an *"Export Workspace to FLOXA Design"* button seamlessly pushes the project into FLOXA Design with zero manual setup.

### 3.5 Module 5: Escrow Payment & Milestone Ledger
* Multi-currency support (INR via Razorpay, USD/EUR via Stripe Connect).
* **Escrow States:** `AWAITING_DEPOSIT` -> `HELD_IN_ESCROW` -> `IN_REVIEW` -> `RELEASED_TO_TALENT` -> `DISPUTED` -> `REFUNDED`.
* **Dispute & Grace Period Engine:**
  * If a client goes unresponsive for 7 days after deliverable submission, funds auto-release to prevent ghosting.
  * If revisions exceed agreed terms, either party can trigger structured dispute arbitration reviewed by Superadmin.

---

## 4. Mobile-First UI/UX System

### 4.1 Mobile Navigation Layout (Bottom Navigation Bar)
1. **Feed (Home):** Visual scroll of talent showcases, case studies, and brief highlights.
2. **Explore / Briefs:** Filterable marketplace of active briefs (by category, budget, timeline).
3. **Action (+) Button:** Context-aware floating button:
   - For Clients: *"Post a Brief"*
   - For Freelancers: *"Post Proof-of-Work / Pitch"*
4. **Messages / Calls:** Active negotiations, project chats, and WebRTC call history.
5. **Workspace / Profile:** Active client contracts, escrow balance, earnings, and personal portfolio.

### 4.2 Progressive Web App (PWA) Ready
* Service worker caching for fast offline profile viewing.
* Web Push notifications for new proposals, milestone submissions, chat messages, and escrow releases.

---

## 5. Database Schema & Architecture (MongoDB / Mongoose)

```text
Models:
├── User.ts                 # Auth, role (freelancer, client, dual), credentials
├── TalentProfile.ts        # Bio, hourly/project rates, availability, verified badges
├── SocialPost.ts           # Proof-of-Work cards, media URLs, likes, comments
├── Brief.ts                # Client brief, discovery sliders, budget, deadline
├── Proposal.ts             # Mini-Discovery pitch, diagnostic answers, proposed milestones
├── Contract.ts             # Active project, MSA agreement, total budget, status
├── Milestone.ts            # Phase name, amount, deliverables, revision history, escrow state
├── Transaction.ts          # Payment gateway records (Stripe/Razorpay charges and transfers)
├── Message.ts              # Real-time chat messages, file attachments, call records
└── Dispute.ts              # Arbitration evidence, dispute reasons, admin resolution
```

---

## 6. Sprint-by-Sprint Execution Roadmap

| Sprint | Timeline | Objectives & Deliverables |
| :--- | :--- | :--- |
| **Sprint 1: Architecture & Social Profiles** | Weeks 1-3 | Next.js 16 + Express backend scaffolding; MongoDB schemas; JWT auth; Mobile bottom navigation; Talent profile builder & Proof-of-Work feed. |
| **Sprint 2: Guided Brief Builder & Feed** | Weeks 4-5 | Client 4-frame brief wizard; Gemini AI brief enhancement; Public briefs feed with category/budget filters; Token-based client access. |
| **Sprint 3: Mini-Discovery Bidding System** | Weeks 6-8 | Proposal submission modal with diagnostic cards and sliders; Client swipeable proposal review interface; Proposal shortlisting. |
| **Sprint 4: Escrow Engine & Contracts** | Weeks 9-11 | Auto-generated digital MSA agreement with e-signature; Stripe/Razorpay Escrow integration; Milestone fund locking and release webhooks. |
| **Sprint 5: In-Platform Workspace & Realtime** | Weeks 12-14 | Active contract workspace; Deliverable upload & revision engine; WebSockets real-time messaging; WebRTC 1-click video/audio call room. |
| **Sprint 6: PWA Polish & Launch Readiness** | Weeks 15-16 | Mobile touch gestures; Web Push notifications; Superadmin escrow management dashboard; E2E regression testing; Production deployment. |

---

## 7. Technology Stack Checklist

* **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion (mobile swipe gestures).
* **Backend:** Node.js (v20/v22 LTS), Express 4.x, TypeScript 5.7, Mongoose 9.x.
* **Database:** MongoDB 7.0+ (Replica Set for multi-document ACID transactions on escrow).
* **Realtime:** WebSockets (`ws`) for messaging and presence; WebRTC for browser-based video/voice calls.
* **Storage:** Centralized media service (S3/Cloudinary or local storage with streaming).
* **Payments:** Stripe Connect & Razorpay Route for marketplace escrow splits.

