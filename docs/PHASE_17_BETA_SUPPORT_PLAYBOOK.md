# FLOXA WORK — PHASE 17 BETA SUPPORT PLAYBOOK

**Purpose:** Operational Guide for Managing Support, Moderation, and Safety for Early Beta Users  
**Tooling:** Utilizes existing built-in administrative tools and APIs without third-party subscription overhead.  

---

## 1. Support Ingestion Channels

For early beta users, support is delivered via three structured in-app touchpoints:

| Category | User Ingestion Channel | In-App Flow / API Trigger | Operator Handling SLA |
| :--- | :--- | :--- | :---: |
| **Abuse & Safety Reports** | User Report Modal (`UserReport`) | `POST /api/moderation/reports` | **< 2 hours** (P0 Safety) |
| **Project & Payment Disputes** | Workspace Dispute Tab | `POST /api/contracts/:id/disputes` | **< 24 hours** |
| **Technical Bugs & Help** | Contact / Help Modal | Direct in-app ticket / Email `support@floxa.work` | **< 12 hours** |
| **Direct User Communication Block** | Direct Chat Menu | `POST /api/users/:id/block` | **Instant Automated** |

---

## 2. Standard Operating Procedures (SOP)

### SOP-01: Handling User Abuse or Impersonation Reports
1. **Notification:** A new report appears in the Admin Portal under "Safety & Moderation Queue".
2. **Review:** Operator reviews the reported user profile, portfolio links, chat transcripts, and reporter notes.
3. **Action Tiers:**
   - *Tier 1 (Warning):* Dispatch administrative notice to user.
   - *Tier 2 (Restriction):* Apply communication or proposal restrictions via `PATCH /api/admin/users/:id/restrictions`.
   - *Tier 3 (Suspension):* Instantly suspend user account via `POST /api/admin/users/:id/suspend` with mandatory audit reason. Login is immediately blocked.

### SOP-02: Managing Project Milestone & Payment Disputes
1. **Notification:** Participant opens a dispute on a milestone or unacknowledged external payment. Milestone deliverable signoff is paused.
2. **Investigation:**
   - Inspect agreed contract scope snapshot.
   - Inspect milestone deliverables, version history, and revision comments.
   - Inspect client-reported UTR reference / bank receipt.
3. **Facilitation:**
   - Post operator guidance message into the dedicated dispute thread (`POST /api/disputes/:id/messages`).
   - Reiterate non-custodial disclosure: FLOXA facilitates evidence review and milestone communication, but does not execute financial chargebacks or transfers.
4. **Resolution:**
   - If resolved mutually, mark dispute resolved and resume workspace.
   - If bad-faith actor identified, issue administrative warning or suspend non-compliant user.

### SOP-03: Urgent Security Incidents
1. **Token Invalidation:** In the event of reported account compromise, operator executes session revocation in the database, purging all active refresh token families.
2. **Audit Inspection:** Review immutable administrative audit logs (`GET /api/admin/audit-logs`) to identify affected endpoints, timestamps, and IP addresses.
3. **Notification:** Notify affected user via verified email and prompt secure password reset.

