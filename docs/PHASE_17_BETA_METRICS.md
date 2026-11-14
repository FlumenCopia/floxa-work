# FLOXA WORK — PHASE 17 BETA METRICS & PRIVACY-CONSCIOUS ANALYTICS

**Guiding Principle:** Track marketplace health and operational throughput without tracking invasive personal data.  
**Critical Accounting Rule:** Contractual project values and user-reported external payment settlements must **never** be labeled or aggregated as FLOXA revenue.  

---

## 1. Beta Marketplace Telemetry Metrics

| Metric Key | Definition | Source / Aggregation | Privacy & Revenue Distinction |
| :--- | :--- | :--- | :--- |
| **`clients_registered`** | Total active registered clients | `User.countDocuments({ role: 'client' })` | Count only; zero PII exposed |
| **`freelancers_registered`** | Total active registered freelancers | `User.countDocuments({ role: 'freelancer' })` | Count only; zero PII exposed |
| **`profiles_completed`** | Freelancers with headline, bio, rate, skills | `TalentProfile.countDocuments({ isComplete: true })` | Completeness index for discovery health |
| **`briefs_published`** | Live project briefs created by clients | `Brief.countDocuments({ status: 'open' })` | High-level category breakdown |
| **`proposals_submitted`** | Mini-Discovery diagnostic pitches sent | `Proposal.countDocuments()` | Marketplace demand indicator |
| **`proposal_response_rate`**| % of briefs that receive ≥ 1 proposal | Computed ratio (`briefs_with_proposals / total_briefs`) | Liquidity metric |
| **`proposal_acceptance_rate`**| % of submitted proposals accepted | Computed ratio (`accepted_proposals / total_proposals`) | Match efficacy metric |
| **`active_contracts`** | Projects currently in collaboration workspace | `Contract.countDocuments({ status: 'active' })` | Operational pipeline load |
| **`completed_projects`** | Projects with mutual closeout confirmed | `Contract.countDocuments({ status: 'completed' })` | Milestone fulfillment index |
| **`external_settlements_logged`**| User-reported external transfers (bank/UPI) | `PaymentRecord.countDocuments({ status: 'acknowledged' })` | **Non-Custodial Note:** External payment records; 0% platform money custody. |
| **`dispute_rate`** | % of contracts that open a mediation ticket | Computed ratio (`disputed_contracts / total_contracts`) | Trust and safety index (Target < 2%) |

---

## 2. Platform Revenue & Financial Integrity Invariant

```
  ┌─────────────────────────────────────────────────────────────┐
  │                 NON-CUSTODIAL REVENUE SEPARATION            │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
  ┌─────────────────────────────┐ ┌─────────────────────────────┐
  │  TOTAL CONTRACTUAL SCOPE    │ │   ACTUAL COMPANY REVENUE    │
  │  (Gross Contracted Work)    │ │   (Direct Subscriptions)    │
  │  - Sum of agreed bids       │ │   - Early beta access fees  │
  │  - Settled directly via     │ │   - ZERO % cut of project   │
  │    external bank/UPI rails  │ │     milestone payments      │
  │  - ZERO funds held by FLOXA │ │   - Separated in financial  │
  │  - NOT PLATFORM REVENUE     │ │     reporting               │
  └─────────────────────────────┘ └─────────────────────────────┘
```

In all administrative views, exports, and executive summaries:
- Contract values are labeled as **"Total Contractual Value (External Direct Settlement)"**.
- Platform revenue is reported strictly as direct platform fees (if any), with an explicit notice:
  *"FLOXA Work operates on a 0% escrow custody model. Gross contractual value reflects work coordinated between independent parties and does not represent company revenue or platform cash balances."*

