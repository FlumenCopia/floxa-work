# FLOXA Work — Payment Architecture & Non-Custody Model Report

**Date:** 2026-11-14  
**Architecture Lead:** Principal Systems Architect  
**Compliance Standard:** 0% Platform Financial Custody / Direct User Settlement  

---

## 1. Executive Summary & Legal Business Model

FLOXA Work is a Discovery-First freelance marketplace, project agreement coordinator, and proof-of-work collaboration network. 

**FLOXA Work DOES NOT PROVIDE ESCROW, HOLD USER BALANCES, OR ACT AS A FINANCIAL INTERMEDIARY.**

Clients and freelancers execute payments directly between themselves via external financial channels, including:
- Direct Bank Transfers (NEFT, RTGS, IMPS, Wire transfers).
- UPI (Unified Payments Interface — Google Pay, PhonePe, Paytm).
- Direct Stripe invoicing initiated between the parties.
- Direct Razorpay links initiated between the parties.
- Other mutually agreed bilateral payment methods.

---

## 2. Terminology Realignment Table

All legacy, misleading escrow terminology has been eliminated across backend models, controllers, frontend views, and notifications:

| Obsolete / Misleading Term | Production Corrected Term | Architectural Meaning |
|---|---|---|
| Escrow | **Direct Payment** | Bilateral payment outside platform. |
| Held in Escrow | **Payment Pending** | Awaiting external settlement between parties. |
| Release Escrow / Funds | **Record Payment / Confirm Payment** | User reports or acknowledges external settlement. |
| Escrow Balance / Wallet | **Removed Completely** | FLOXA holds 0 funds; no platform wallet exists. |
| Approve & Pay | **Approve Deliverable** | Client accepts handover assets. Money transfer is not simulated. |
| Payment Released | **Confirmed by Parties** | Freelancer acknowledges receipt in external bank account. |
| `DIRECT_PAY_TIMESTAMP` | **User UTR / Reference** | Real transaction reference or UTR entered by user. |

---

## 3. Dual State Machine Architecture

FLOXA Work strictly decouples **Deliverable Inspection** from **Payment Settlement**. A client approving a deliverable does not trigger, simulate, or claim an automated financial transfer.

```
A. Deliverable Lifecycle State Machine
[DRAFT] 
   └──> [IN_PROGRESS] 
           └──> [SUBMITTED] 
                   └──> [IN_REVIEW] 
                           ├──> [REVISION_REQUESTED] ──> [RESUBMITTED]
                           └──> [APPROVED] ──> [COMPLETED]

B. Direct Payment Record State Machine
[NOT_RECORDED]
   └──> [REPORTED_BY_CLIENT] (Client enters payment method, UTR & optional receipt)
           ├──> [ACKNOWLEDGED_BY_FREELANCER] (Confirmed received in external bank account)
           ├──> [DISPUTED] (Freelancer reports payment was not received or differs)
           └──> [CANCELLED]
```

---

## 4. Database Models & Schema Specifications

### A. PaymentRecord Model (`backend/src/models/PaymentRecord.model.ts`)
```typescript
export interface IPaymentRecord {
  contractId: Types.ObjectId;
  milestoneId: Types.ObjectId;
  payerId: Types.ObjectId; // Client
  payeeId: Types.ObjectId; // Freelancer
  amount: number;
  currency: string;
  paymentMethod: 'bank_transfer' | 'upi' | 'razorpay_direct' | 'stripe_direct' | 'paypal' | 'other';
  paymentMethodDetails?: string;
  reportedDate: Date;
  externalReference?: string; // UTR or external transaction ID
  receiptFileUrl?: string; // Link to uploaded receipt in FileRecord
  status: 'not_recorded' | 'reported_by_client' | 'acknowledged_by_freelancer' | 'disputed' | 'cancelled';
  acknowledgedAt?: Date;
  notes?: string;
  disputeReason?: string;
}
```

### B. Milestone Model Refactoring (`backend/src/models/Milestone.model.ts`)
- `deliverableStatus`: `'draft' | 'in_progress' | 'submitted' | 'in_review' | 'revision_requested' | 'resubmitted' | 'approved' | 'completed'`
- `paymentStatus`: `'not_recorded' | 'reported_by_client' | 'acknowledged_by_freelancer' | 'disputed' | 'cancelled'`
- `paymentDetails`: Stores external method, user UTR, receipt URL, and acknowledgment timestamp.
- Legacy `escrowState` maintained strictly as a virtual getter for backwards compatibility.

---

## 5. API Endpoints & Workflows

1. `POST /api/milestones/:id/deliverable`
   - **Role:** Freelancer
   - **Payload:** `{ fileUrls: string[], notes: string }`
   - **Action:** Moves `deliverableStatus` to `in_review` and starts 7-day client inspection window.
2. `POST /api/milestones/:id/approve`
   - **Role:** Client
   - **Action:** Marks `deliverableStatus = 'approved'`. Does **not** simulate financial release.
3. `POST /api/milestones/:id/payment/report`
   - **Role:** Client
   - **Payload:** `{ paymentMethod, paymentMethodDetails, externalReference, receiptFileUrl, notes }`
   - **Action:** Records client report of external direct transfer in `PaymentRecord` collection.
4. `POST /api/milestones/:id/payment/acknowledge`
   - **Role:** Freelancer
   - **Action:** Freelancer confirms receipt of funds in their external account. Updates volume in `TalentProfile`.
5. `POST /api/milestones/:id/payment/dispute`
   - **Role:** Freelancer / Client
   - **Payload:** `{ reason: string }`
   - **Action:** Flags transaction as disputed for administrative mediation.

---

## 6. Automated Test Verification Results

All direct payment workflows were verified against live MongoDB instance via `node backend/tests/production_e2e_verification.test.cjs`:

```
1. Client created brief and accepted proposal:
   - Initial 40% Advance Milestone established.
2. Freelancer uploaded deliverable package:
   - Deliverable moved to "in_review" window.
3. Client approved deliverable:
   - Deliverable status: approved. Zero money transfer claimed.
4. Client recorded direct external payment:
   - Payment method: bank_transfer
   - External reference: UTR-20261114-9842187
   - Payment status: reported_by_client.
5. Freelancer acknowledged receipt in external account:
   - Payment status: acknowledged_by_freelancer.
   - Profile direct volume aggregated: $10,560.
```
