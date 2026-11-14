# FLOXA WORK — Phase 9: Saved Items & Invitations Report

## 1. Executive Summary
The Saved Items and Project Invitations subsystem bridges organic discovery and structured collaboration. It allows clients and freelancers to bookmark high-potential counterparts, while offering clients a formal mechanism to invite top specialists into their open project briefs without violating the platform's core zero-custody and mini-discovery constraints.

---

## 2. Saved Items Architecture (`SavedItem.model.ts`)
- **Schema Design:**
  - `userId`: ObjectId ref to User (the bookmark owner).
  - `itemType`: `'freelancer' | 'project'`.
  - `itemId`: ObjectId ref to User or Brief.
  - `notes`: Optional private user annotation.
  - `createdAt`: Timestamp.
- **Integrity Safeguards:**
  - Unique compound index `{ userId: 1, itemType: 1, itemId: 1 }` guarantees zero duplicate saves.
  - Strict tenant isolation: Queries unconditionally scope by `req.user.id`.

---

## 3. Project Invitation Lifecycle (`Invitation.model.ts`)

```
                 Client creates Brief
                          │
                          ▼
            Client sends Invitation (POST /api/invitations)
                          │
            Status: "pending" ───(Client cancels)───► Status: "cancelled"
                          │
           ┌──────────────┴──────────────┐
           ▼                             ▼
Freelancer Accepts              Freelancer Declines
(PUT /invitations/:id/accept)   (PUT /invitations/:id/decline)
           │                             │
           ▼                             ▼
  Status: "accepted"             Status: "declined"
           │
           ▼
Signals Client & Directs Freelancer
to Submit Mini-Discovery Pitch
(Contract is NOT automatically generated;
zero custody terms must be agreed).
```

### Safety & Invariant Highlights
1. **Ownership Enforcement:** A client can only send invitations for project briefs they explicitly created. Attempting to invite a freelancer to another client's brief immediately aborts with `403 Forbidden`.
2. **Duplicate Protection:** Unique compound index `{ briefId: 1, freelancerId: 1 }` prevents invitation spam.
3. **No Contract Bypassing:** Accepting an invitation **never** creates a binding contract, releases funds, or bypasses the Mini-Discovery proposal process. It initiates an informed dialogue where the specialist reviews the diagnostic problem and submits their milestone plan.
