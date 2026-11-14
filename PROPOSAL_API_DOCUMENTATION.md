# FLOXA WORK — PROPOSAL API DOCUMENTATION

**Phase:** 8 — Advanced Mini-Discovery Proposal Comparison Engine  
**Base URL:** `http://localhost:5001/api`  
**Authentication:** Bearer JWT required on all endpoints (`requireAuth`)

---

## 1. Endpoints

### `POST /api/proposals`
Submits a Mini-Discovery Proposal for a discovery brief.
- **Authorization:** Authenticated Freelancer
- **Payload:**
  ```json
  {
    "briefId": "6af80...",
    "problemDiagnosis": {
      "understanding": "Detailed diagnosis...",
      "rootCauses": ["Cause 1", "Cause 2"],
      "risksAndConstraints": ["Risk 1"],
      "clarifyingQuestions": ["Question 1"]
    },
    "proposedStrategy": {
      "strategicApproach": "Methodology...",
      "expectedOutcomes": ["Outcome 1"]
    },
    "strategicSliders": [
      { "key": "craft_direction", "label": "Craft vs Speed", "value": 85 }
    ],
    "proposedMilestones": [
      { "title": "Milestone 1", "amount": 1200, "deliveryDays": 7 },
      { "title": "Milestone 2", "amount": 1200, "deliveryDays": 10 },
      { "title": "Milestone 3", "amount": 600, "deliveryDays": 4 }
    ],
    "totalPrice": 3000,
    "estimatedDays": 21,
    "portfolioItems": [
      { "title": "Case Study", "url": "https://..." }
    ]
  }
  ```
- **Validation:**
  - Milestone amounts must sum to `totalPrice` within $2.
  - Freelancer cannot submit more than one proposal per brief (HTTP 409).
- **Response:** `201 Created`

---

### `GET /api/briefs/:briefId/proposals`
Retrieves all competing proposals for a specific discovery brief.
- **Authorization:** Brief Owner Client or Admin only. Other clients and competing freelancers receive **HTTP 403 Forbidden**.
- **Query Parameters:**
  - `status`: `all`, `pending`, `shortlisted`, `accepted`, `declined`
  - `sortBy`: `recent`, `price_asc`, `price_desc`, `days_asc`, `milestones`
  - `search`: Filter by consultant name or diagnostic keywords
- **Response:** `200 OK` `{ brief, proposals, count }`

---

### `GET /api/proposals/:id`
Retrieves full details of a specific proposal.
- **Authorization:** Proposal author, brief owner, or admin. Unauthorized users receive **HTTP 403 Forbidden**.
- **Response:** `200 OK` `{ proposal }`

---

### `POST /api/proposals/:id/shortlist`
Toggles a proposal between `shortlisted` and `pending`.
- **Authorization:** Brief Owner Client only.
- **Response:** `200 OK` `{ message, proposal }`

---

### `POST /api/proposals/:id/decline`
Declines a proposal with optional client feedback.
- **Authorization:** Brief Owner Client only.
- **Payload:** `{ "reason": "Timeline does not fit our sprint cycle." }`
- **Response:** `200 OK` `{ message, proposal }`

---

### `POST /api/proposals/:id/withdraw`
Allows a freelancer to retract a pending proposal prior to acceptance.
- **Authorization:** Proposal author only.
- **Response:** `200 OK` `{ message, proposal }`

---

### `POST /api/proposals/compare`
Generates side-by-side comparison data and metrics for 2 to 4 proposals.
- **Authorization:** Brief Owner Client only.
- **Payload:**
  ```json
  {
    "briefId": "6af80...",
    "proposalIds": ["6af81...", "6af82..."]
  }
  ```
- **Response:** `200 OK` `{ brief, proposals, comparisonMetrics }`
