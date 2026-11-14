# FLOXA WORK — Phase 10: Project Workspace Architecture

## 1. Executive Summary
The Project Collaboration Workspace is the operational command center established once a client accepts a Mini-Discovery proposal. It enforces the immutable agreed scope captured in the accepted contract snapshot while providing a multi-dimensional environment for milestone execution, task tracking, deliverable review, secure file distribution, real-time communication, and formal closeout.

---

## 2. Architectural Boundaries & Data Flow

```
                      Proposal Accepted
                              │
                              ▼
                Contract Created (Snapshot Stored)
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│     Contract Authoritative    │   │  Independent State Machines   │
│     Scope (Immutable Terms)   │   │                               │
│ • Deliverables required       │   │ 1. Deliverable Review State   │
│ • Contractual milestone values│   │    (draft -> review -> apprv) │
│ • Target timeline             │   │ 2. Direct External Payment    │
│ • Client & Freelancer IDs     │   │    (reported -> acknowledged) │
└───────────────┬───────────────┘   └───────────────┬───────────────┘
                │                                   │
                └─────────────────┬─────────────────┘
                                  ▼
                   ┌─────────────────────────────┐
                   │  Project Collaboration Hub  │
                   │                             │
                   │ • Milestones & Submissions  │
                   │ • Task Management Board     │
                   │ • Private Discussion Room   │
                   │ • Files & Deliverables Vault│
                   │ • Audit Activity Timeline   │
                   │ • Dual Closeout Handover    │
                   └─────────────────────────────┘
```

---

## 3. Strict Authorization & IDOR Defenses
1. **Zero-Trust Contract Boundaries:**
   - Every workspace endpoint (`/api/contracts/:contractId/*`, `/api/tasks/:taskId/*`, `/api/milestones/:milestoneId/*`) strictly validates that `req.user.id` is either `contract.clientId`, `contract.freelancerId`, or an active administrator.
   - Non-participants receive an immediate `403 Forbidden` response.
2. **Authoritative Scope Immutability:**
   - The workspace references `contract.proposalSnapshot` for agreed terms, ensuring subsequent changes to the original proposal or brief cannot retroactively modify an active contract.
3. **Permanent Non-Custodial Guarantee:**
   - Deliverable approval only impacts work status (`deliverableStatus = 'approved'`).
   - Payment settlement is tracked strictly as user-reported external direct arrangements (bank transfer, UPI, Stripe invoice). The platform never maintains wallets, holds funds, or automatically releases payments.
