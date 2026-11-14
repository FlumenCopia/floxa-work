# FLOXA Work — Platform Analytics Specification

**Module:** Executive Business Intelligence & Marketplace Aggregation Engine  
**Route:** `GET /api/admin/stats` & `GET /api/admin/analytics/marketplace`  
**Security Tier:** `analytics:view` Permission Guarded  
**Date:** 14 November 2026  

---

## 1. Architectural Mandate: Non-Custodial Direct Settlement Decoupling

FLOXA Work operates strictly as a discovery-first freelance marketplace and agreement coordinator. **The platform holds zero escrow custody and does not process, custody, or disburse client payments.**

In accordance with this mandatory business invariant, all platform analytics calculations maintain a strict mathematical and terminological boundary between:
1. **Contractual Scope Values (`Contract.totalBudget`):** The negotiated, legally agreed total commercial scope for contracted projects.
2. **User-Reported External Settlements (`PaymentRecord.amount`):** Self-reported external bank transfers (NEFT/RTGS/IMPS), UPI transfers, or direct Stripe/Razorpay invoices settled peer-to-peer outside the platform.

Under no circumstances are either of these metrics aggregated as, conflated with, or presented as FLOXA platform revenue.

---

## 2. High-Performance MongoDB Aggregation Pipelines

All executive statistics are computed using native multi-stage MongoDB aggregation pipelines with date-index optimization to prevent in-memory bottlenecks.

### A. Contractual Value Pipeline
```typescript
const contractualAgreedAgg = await Contract.aggregate([
  { $match: dateFilter },
  {
    $group: {
      _id: null,
      totalValue: { $sum: '$totalBudget' },
      avgValue: { $avg: '$totalBudget' },
      count: { $sum: 1 },
    },
  },
]);
```

### B. User-Reported External Settlement Pipelines
```typescript
const acknowledgedExternalAgg = await PaymentRecord.aggregate([
  { $match: { status: 'acknowledged_by_freelancer' } },
  { $group: { _id: null, total: { $sum: '$amount' } } },
]);
```

---

## 3. Marketplace Health & Funnel Conversion Analytics

The endpoint `GET /api/admin/analytics/marketplace` computes end-to-end conversion efficiency across the freelance discovery funnel:

$$\text{Brief-to-Proposal Ratio} = \frac{\text{Total Proposals Submitted}}{\max(1, \text{Total Briefs Created})}$$

$$\text{Proposal-to-Contract Rate} = \left(\frac{\text{Total Contracts Initialized}}{\max(1, \text{Total Proposals Submitted})}\right) \times 100\%$$

$$\text{Project Completion Rate} = \left(\frac{\text{Total Contracts Finalized}}{\max(1, \text{Total Contracts Initialized})}\right) \times 100\%$$

$$\text{Dispute Incidence Rate} = \left(\frac{\text{Total Disputes Opened}}{\max(1, \text{Total Contracts Initialized})}\right) \times 100\%$$

### Category Breakdown Aggregation
The pipeline aggregates brief volume, total budget allocations, and completed projects grouped by professional discipline:
- `branding`
- `uiux`
- `fullstack`
- `mobile`
- `ai_ml`
- `content`

---

## 4. Mandatory API Response Disclosures

Every analytics response payload includes an immutable compliance notice:
```json
{
  "nonCustodialNotice": "FLOXA Work is a discovery and collaboration platform with ZERO ESCROW CUSTODY. Contractual budgets represent agreed work scopes between independent parties. External settlements represent direct user-reported peer-to-peer bank/UPI/invoice transfers and DO NOT constitute FLOXA platform revenue."
}
```
