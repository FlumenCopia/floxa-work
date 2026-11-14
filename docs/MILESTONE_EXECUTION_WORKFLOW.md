# FLOXA WORK — Phase 10: Milestone Execution & Deliverable Lifecycle

## 1. Deliverable State Machine
Deliverables progress through a rigorous, linear lifecycle with full historical auditing:

```
[not_started / draft] ──► [in_progress]
                               │
                (Specialist submits package)
                               ▼
                        [in_review]
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
(Client requests changes)             (Client approves package)
            │                                     │
            ▼                                     ▼
  [revision_requested]                        [approved]
            │                                     │
(Specialist resubmits v2)                         ▼
            │                                [completed]
            └──────────────► [in_review]
```

### State Definitions
- `in_progress`: Specialist is actively developing the milestone objectives.
- `in_review`: Specialist uploaded a deliverable package; client inspection window is open.
- `revision_requested`: Client provided explicit change requirements. Milestone remains pending approval.
- `approved`: Client accepted the deliverable package. Actor ID and timestamp permanently recorded.

---

## 2. Independent Payment State Machine (0% Platform Custody)

| Deliverable State | Payment State | Platform Action |
| :--- | :--- | :--- |
| `in_progress` | `not_recorded` | No payment action taken. |
| `in_review` | `not_recorded` | Client inspects files before arranging external funds. |
| `approved` | `not_recorded` | Deliverable approved. Direct payment can now be settled externally. |
| `approved` | `reported_by_client` | Client records external bank UTR or invoice reference. |
| `approved` | `acknowledged_by_freelancer` | Freelancer confirms funds arrived in their own bank/account. |
| `approved` | `disputed` | Freelancer reports discrepancy; mediation log opened. |

**Critical Architectural Invariant:**
Approving a deliverable **never** triggers money movement, automated escrow release, or payment status changes. Payment status changes only when parties submit user-reported external settlement records.
