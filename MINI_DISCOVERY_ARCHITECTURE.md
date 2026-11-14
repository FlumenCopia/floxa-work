# FLOXA WORK — MINI-DISCOVERY PROPOSAL ARCHITECTURE

**Phase:** 8 — Advanced Mini-Discovery Proposal Comparison Engine  
**Architect:** Principal Product Architect & Senior Full-Stack Engineer  
**Status:** **IMPLEMENTED & VERIFIED**

---

## 1. Product Vision & Differentiator

Traditional freelance marketplaces reduce talent evaluation to a race-to-the-bottom auction:
- Lowest hourly rate.
- Aggressive delivery promises.
- Generic AI-generated cover letters.
- Volume-based star ratings.

**FLOXA Work inverts this dynamic through Discovery-First Evaluation.**

Before committing funds or signing contracts, clients evaluate freelancers through structured diagnostic thinking. The Mini-Discovery Proposal empowers clients to answer the five essential engagement questions:

1. **Who understands my actual business problem?** (Diagnostic breakdown vs surface symptoms)
2. **Who has the strongest diagnostic thinking?** (Identified root causes and unstated constraints)
3. **Who proposes the most suitable strategy?** (Execution methodology and architectural approach)
4. **Who can deliver through a realistic milestone plan?** (Staged deliverables with reconciled contractual pricing)
5. **Who provides the strongest relevant portfolio evidence?** (Demonstrated proof of work in matching problem domains)

---

## 2. Structured Proposal Data Architecture

Each Mini-Discovery Proposal (`Proposal.model.ts`) contains 7 structured sections:

```
+--------------------------------------------------------------------------+
|                     Mini-Discovery Proposal Schema                       |
+--------------------------------------------------------------------------+
| briefId                  : ObjectId (ref: Brief, indexed)                |
| freelancerId             : ObjectId (ref: User, indexed)                 |
| status                   : enum: draft, pending, shortlisted,            |
|                                  accepted, declined, withdrawn           |
|                                                                          |
| [Section A: Problem Diagnosis]                                           |
|   diagnosticAnswers      : [{ question, answer }]                        |
|   problemDiagnosis       : {                                             |
|     understanding        : String (Deep analytical diagnosis),           |
|     rootCauses           : [String] (Identified architectural causes),   |
|     risksAndConstraints  : [String] (Regulatory/technical boundaries),   |
|     clarifyingQuestions  : [String] (Pre-award consultant queries)       |
|   }                                                                      |
|                                                                          |
| [Section B: Proposed Strategy]                                           |
|   proposedStrategy       : {                                             |
|     strategicApproach    : String (Recommended methodology),             |
|     solutionArchitecture : String (Component/system semantics),          |
|     expectedOutcomes     : [String] (Measurable business impacts),       |
|     dependencies         : [String] (Client/third-party dependencies),   |
|     alternativeApproaches: String (Tradeoffs considered)                 |
|   }                                                                      |
|                                                                          |
| [Section C: Strategy Dimensions]                                         |
|   strategicSliders       : [{ key, label, value (0-100), rationale }]    |
|                                                                          |
| [Section D: Milestone Execution Plan]                                    |
|   proposedMilestones     : [{                                            |
|     title                : String,                                       |
|     description          : String,                                       |
|     deliverables         : [String],                                     |
|     amount               : Number (Proposed contractual value),          |
|     deliveryDays         : Number (Duration in days),                    |
|     acceptanceCriteria   : String,                                       |
|     revisionAssumptions  : String                                        |
|   }]                                                                     |
|                                                                          |
| [Section E: Pricing & Timeline]                                          |
|   totalPrice             : Number (Strictly reconciles with milestones), |
|   currency               : String (Default: 'USD'),                      |
|   pricingModel           : String ('fixed_milestone_direct'),            |
|   estimatedDays          : Number,                                       |
|   assumptionsAndExclusions: String                                       |
|                                                                          |
| [Section F: Portfolio Proof Evidence]                                    |
|   portfolioItems         : [{ title, description, category, role, url }],|
|   portfolioProofUrls     : [String]                                      |
|                                                                          |
| [Section G: Freelancer Introduction]                                     |
|   freelancerIntro        : { coverNote, relevantExperience, availability }|
+--------------------------------------------------------------------------+
```

---

## 3. Milestone Reconciliation & Integrity

To prevent pricing ambiguities between proposal bids and milestone contracts:
$$\sum_{i=1}^{n} \text{milestone.amount}_i = \text{totalPrice}$$
The backend enforces that the sum of all milestone values matches the total bid price within a 2-dollar rounding tolerance. Proposals failing reconciliation are rejected with HTTP 400 Bad Request.

---

## 4. Proposal Lifecycle & State Machine

```
[ draft ]
    |
    v
[ pending ] <-------------------+
    |                           |
    +-----> [ shortlisted ] ----+
    |           |
    |           +-----> [ accepted ] (Initializes Contract & declines competing)
    |
    +-----> [ declined ]
    |
    +-----> [ withdrawn ] (Freelancer retracts before acceptance)
```

1. **Shortlisting:** Clients can toggle proposals into `shortlisted` to filter high-potential candidates without declining others.
2. **Acceptance:** Accepting a proposal immutably snapshots the agreed terms onto `contract.proposalSnapshot`, initializes the 3-stage milestone structure, and marks competing proposals as `declined`.
3. **Duplicate Prevention:** A brief can have only one active accepted contract.
