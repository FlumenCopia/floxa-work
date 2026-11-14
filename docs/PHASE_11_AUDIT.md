# FLOXA WORK — PHASE 11 AUDIT & ARCHITECTURE PLAN
## Trust, Reputation, Verified Reviews, Dispute Workflows & User Safety

**Document Version:** 1.0.0  
**Date:** 14 November 2026  
**Status:** In Progress / Active Execution  
**Target Milestone:** Phase 11 Production Readiness  

---

## 1. Executive Summary

Phase 11 introduces a comprehensive, abuse-resistant trust and reputation infrastructure to FLOXA Work. Unlike legacy platforms where reviews can be bought, weaponized through retaliatory ratings, or disconnected from actual contracts, FLOXA Work anchors all reviews to verified, completed contracts through a cryptographically enforced double-blind publication policy.

Furthermore, Phase 11 delivers a multi-stage dispute resolution system and user safety suite (reporting, blocking, moderation queues) designed to mediate collaboration issues without violating FLOXA Work's core non-custodial financial invariant.

---

## 2. Invariant: 0% Platform Custody & Direct Billing

FLOXA Work remains strictly a discovery-first freelance marketplace and contract coordinator:
1. **Zero Escrow / Zero Digital Wallets:** The platform does not hold, manage, debit, or disburse customer funds.
2. **Direct Financial Settlement:** Clients pay freelancers directly via external banking/UPI/payment channels.
3. **Mediation Scope:** Platform disputes serve strictly as factual, deliverable, and conduct mediation, never financial custody release or automated fund reversals.

---

## 3. Current State & Gap Analysis

| Component | Pre-Phase 11 State | Phase 11 Target Implementation |
| :--- | :--- | :--- |
| **Reviews Model** | Missing; only static/mock rating fields in `TalentProfile`. | `Review.model.ts` with compound uniqueness `{ contractId, reviewerId }`, sub-scores, and status workflow. |
| **Review Eligibility** | None. Anyone could theoretically claim a review. | Cryptographically verified: strictly participants of a contract where `status === 'completed'` and `closeoutStatus === 'completed'`. |
| **Double-Blind Publishing** | None. | `pending_mutual` initial status; both parties' reviews held hidden until both submit or policy window expires, preventing retaliatory scores. |
| **Reputation Profile** | Hardcoded/mock averages on `TalentProfile`. | Dynamic reputation calculation engine across communication, quality, reliability, professionalism, and completed contract counts for both freelancers and clients. |
| **Disputes** | Milestone dispute only flagged on `PaymentRecord`. No contract-level dispute or mediation thread. | `Dispute.model.ts` and `DisputeMessage.model.ts` supporting 7 categories, evidence attachments, status lifecycle, and private moderator internal notes. |
| **Moderation & Safety** | Basic admin user verification toggle. | `UserReport.model.ts` and `UserBlock.model.ts` with dedicated admin moderation queues and blocked user protections. |

---

## 4. Phase 11 Architecture Plan

### 4.1 Schema Definitions
- **`Review.model.ts`**:
  - `contractId` (ref Contract, required, indexed)
  - `briefId` (ref Brief, indexed)
  - `reviewerId` (ref User, required, indexed)
  - `targetId` (ref User, required, indexed)
  - `role`: `'client_to_freelancer'` | `'freelancer_to_client'`
  - `overallRating`: number (1.0 to 5.0)
  - `communicationRating`: number (1.0 to 5.0)
  - `professionalismRating`: number (1.0 to 5.0)
  - `qualityRating`: number (1.0 to 5.0)
  - `reliabilityRating`: number (1.0 to 5.0)
  - `reviewText`: string (10 to 2000 chars)
  - `status`: `'pending_mutual'` | `'published'` | `'flagged'` | `'hidden'`
  - `isEdited`: boolean (default false)
  - `editedAt`: Date
  - `publishedAt`: Date
  - Unique compound index: `{ contractId: 1, reviewerId: 1 }`

- **`Dispute.model.ts`**:
  - `contractId` (ref Contract, required, indexed)
  - `briefId` (ref Brief)
  - `initiatorId` (ref User, required)
  - `respondentId` (ref User, required)
  - `category`: `'deliverable_quality'` | `'scope_disagreement'` | `'missed_deadlines'` | `'communication_conduct'` | `'payment_disagreement'` | `'commitment_breach'` | `'other'`
  - `title`: string
  - `description`: string
  - `desiredOutcome`: string
  - `status`: `'open'` | `'awaiting_response'` | `'under_review'` | `'escalated'` | `'resolved'` | `'closed'`
  - `assignedModeratorId`: ref User
  - `evidenceFiles`: array of `{ fileUrl, fileName, uploadedBy, uploadedAt }`
  - `resolutionSummary`: string
  - `resolutionAction`: string
  - `resolvedAt`: Date

- **`DisputeMessage.model.ts`**:
  - `disputeId` (ref Dispute, required, indexed)
  - `senderId` (ref User, required)
  - `text`: string
  - `attachments`: string[]
  - `isInternalModeratorNote`: boolean (default false, visible ONLY to moderators/admins)

- **`UserReport.model.ts`**:
  - `reporterId` (ref User, required)
  - `targetUserId` (ref User)
  - `targetType`: `'user'` | `'review'` | `'contract'` | `'message'` | `'brief'`
  - `targetId`: string
  - `reason`: string
  - `details`: string
  - `evidenceUrls`: string[]
  - `status`: `'pending'` | `'investigating'` | `'resolved'` | `'dismissed'`
  - `adminNotes`: string

- **`UserBlock.model.ts`**:
  - `blockerId` (ref User, required)
  - `blockedId` (ref User, required)
  - `reason`: string
  - Unique compound index: `{ blockerId: 1, blockedId: 1 }`

### 4.2 Reputation Engine Formula
```
User Rating = Sum(Published Review Ratings) / Total Published Reviews
```
Individual category metrics:
- Communication Score = Average of `communicationRating` across published reviews.
- Professionalism Score = Average of `professionalismRating` across published reviews.
- Quality Score = Average of `qualityRating` across published reviews.
- Reliability Score = Average of `reliabilityRating` across published reviews.
- Rating Distribution = Counts of 5-star, 4-star, 3-star, 2-star, and 1-star ratings.

---

## 5. Implementation Roadmap

1. **Step 1:** Data Models & Indexes in `backend/src/models/`.
2. **Step 2:** Reputation & Review Controllers with Double-Blind Engine.
3. **Step 3:** Dispute Lifecycle & Internal Moderator Note Protection.
4. **Step 4:** Safety Controller (Reports & Blocks) with Message/Invitation Enforcement.
5. **Step 5:** Express Route Wiring in `backend/src/routes/index.ts`.
6. **Step 6:** Frontend UI Components & Client API in `frontend/`.
7. **Step 7:** Comprehensive 29-Scenario Automated Test Suite & Regressions.
8. **Step 8:** Full System Compilation, Build & Daemon Verification.
9. **Step 9:** Complete Architectural Documentation in `floxa work/docs/`.
