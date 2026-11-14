# FLOXA Work — Marketplace Metrics Dictionary

**Standard:** Platform Governance, Analytics & Financial Disclosures  
**Audience:** Platform Administrators, Operations Leads, Auditors, Regulators  
**Date:** 14 November 2026  

---

## 1. Metrics Taxonomy

| Metric Key | Display Label | Data Source | Calculation Logic | Accounting Classification |
| :--- | :--- | :--- | :--- | :--- |
| `totalContractualAgreedValue` | Total Contractual Agreed Value | `Contract.totalBudget` | $\sum \text{totalBudget}$ across all contracts matching timeframe | Third-Party Contract Scope (Non-Platform Asset) |
| `activeContractualValue` | Active Contract Scope | `Contract.totalBudget` where `status: 'active'` | $\sum \text{totalBudget}$ for ongoing collaboration agreements | Third-Party Committed Scope |
| `completedContractualValue` | Completed Contract Scope | `Contract.totalBudget` where `status: 'completed'` | $\sum \text{totalBudget}$ for dual-party finalized agreements | Historical Project Volume |
| `averageContractValue` | Average Agreed Scope | `Contract.totalBudget` | $\text{Mean}(\text{totalBudget})$ | Average Commercial Engagement Size |
| `reportedExternalPaymentAmount` | User-Reported External Transfers | `PaymentRecord.amount` where `status: 'reported_by_client'` | $\sum \text{amount}$ of client-reported direct bank/UPI payments | Self-Reported External Transfer (Unverified) |
| `acknowledgedExternalPaymentAmount` | Acknowledged External Settlements | `PaymentRecord.amount` where `status: 'acknowledged_by_freelancer'` | $\sum \text{amount}$ confirmed received directly by talent | Peer-Confirmed External Settlement |
| `disputedUserReportedPaymentAmount` | Disputed External Payments | `PaymentRecord.amount` where `status: 'disputed'` | $\sum \text{amount}$ flagged as unreceived or disputed | Disputed External Transfer |
| `proposalToContractRate` | Proposal Conversion Rate | `Proposal` & `Contract` collections | $(\text{Total Contracts} / \text{Total Proposals}) \times 100$ | Funnel Operational Efficiency |
| `projectCompletionRate` | Project Completion Rate | `Contract` collection | $(\text{Completed Contracts} / \text{Total Contracts}) \times 100$ | Marketplace Fulfillment Success |
| `disputeRate` | Dispute Rate | `Dispute` & `Contract` collections | $(\text{Total Disputes} / \text{Total Contracts}) \times 100$ | Platform Risk & Quality Indicator |

---

## 2. Invariant Compliance Checklist

- [x] **No Platform Escrow:** Zero instances of "Escrow Balance", "Held in Vault", or "Platform Custody".
- [x] **No Revenue Mischaracterization:** Neither contractual budgets nor external settlements are labeled as "Gross Revenue", "Platform Sales", or "Net Volume".
- [x] **Direct Settlement Clarity:** User-facing and admin-facing copy explicitly specifies direct bank, UPI, or external invoice settlement between independent parties.
- [x] **Dual State Decoupling:** Deliverable approval state machine operates independently from external payment acknowledgment state machine.
