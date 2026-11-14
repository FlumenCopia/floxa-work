# FLOXA WORK — MASTER DEPLOYMENT FREELANCER JOURNEY TRACE

**Test User:** `master_freelancer@floxa.test` (Synthetic Account)  
**Test Suite:** `backend/tests/phase16_real_user_journeys.test.cjs`  

---

## 1. Journey Execution Summary

1. **Account Registration & Profile:** Created `freelancer` account, completed skills and hourly rate.
2. **Opportunity Discovery:** Browsed open project briefs.
3. **Structured Proposal:** Submitted 2-milestone proposal.
4. **Contract Acceptance:** Real-time WebSocket push received upon client acceptance.
5. **Workspace Access:** Opened workspace, uploaded deliverable v1.
6. **Revision Handling:** Client requested revision; deliverable v2 uploaded and approved.
7. **Payment Acknowledgement:** Freelancer acknowledged external receipt of funds.
8. **Closeout & Reciprocal Review:** Contract closed; reciprocal 5-star review submitted.
- **Invariant:** Freelancer acknowledgement indicates user-reported external receipt; zero platform money was held or moved.
