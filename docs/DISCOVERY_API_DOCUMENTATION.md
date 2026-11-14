# FLOXA WORK — Phase 9: Discovery, Saved Items & Invitations API Reference

## 1. Discovery Endpoints

### 1.1 Search Freelancers
- **Route:** `GET /api/discovery/freelancers`
- **Access:** Public
- **Query Parameters:**
  - `q`: Search keyword across headline, bio, and skills.
  - `category`: Filter by specialization category (`uiux`, `webdev`, `mobile`, `branding`, `marketing`, `consulting`).
  - `minRate` / `maxRate`: Numeric hourly rate bounds.
  - `availability`: `'available'` | `'busy'` | `'not_looking'`.
  - `isVerified`: `'true'` | `'false'`.
  - `page`: Page index (default: `1`).
  - `limit`: Page size (default: `12`).
- **Response:**
  ```json
  {
    "freelancers": [
      {
        "_id": "6af81...",
        "userId": {
          "_id": "6af81...",
          "name": "Aravind V.",
          "handle": "aravind_design",
          "avatarUrl": "https://...",
          "isVerified": true
        },
        "headline": "Principal Product & Brand Designer",
        "primaryCategory": "uiux",
        "skills": ["Figma", "UI/UX", "Design Systems"],
        "hourlyRate": 85,
        "availabilityStatus": "available",
        "ratingAverage": 5.0
      }
    ],
    "pagination": { "page": 1, "limit": 12, "total": 24, "totalPages": 2 }
  }
  ```

### 1.2 Search Projects / Briefs
- **Route:** `GET /api/discovery/projects`
- **Access:** Public
- **Query Parameters:**
  - `q`: Search keyword across title, problem statement, required skills.
  - `category`: Filter by brief category.
  - `minBudget` / `maxBudget`: Filter by project budget range.
  - `skills`: Comma-separated list of required skills.
  - `page` / `limit`: Pagination parameters.
- **Response:**
  ```json
  {
    "projects": [
      {
        "_id": "6af81...",
        "title": "Enterprise Clinical Platform Design System",
        "category": "uiux",
        "budgetMin": 3000,
        "budgetMax": 5000,
        "currency": "USD",
        "requiredSkills": ["Figma", "React"],
        "clientId": { "name": "Sanjay Mehta" }
      }
    ],
    "pagination": { "page": 1, "limit": 12, "total": 8, "totalPages": 1 }
  }
  ```

### 1.3 Calculate Compatibility Match
- **Route:** `GET /api/discovery/match`
- **Access:** Public / Authenticated
- **Query Parameters:**
  - `briefId`: Project Brief ID.
  - `freelancerId`: Talent Profile or User ID.
- **Response:**
  ```json
  {
    "matchResult": {
      "overallScore": 94,
      "ratingTier": "Exceptional Fit",
      "matchingSkills": ["figma", "ui/ux", "design systems", "react"],
      "missingSkills": [],
      "categoryMatch": true,
      "budgetAligned": true,
      "availabilityStatus": "available",
      "portfolioEvidenceCount": 1,
      "explanationSummary": "Strong match based on 4 matching skills...",
      "dimensionBreakdown": {
        "skills": { "score": 100, "weight": 0.25, "weightedScore": 25, "details": "4 of 4 required skills matched" },
        "specialization": { "score": 100, "weight": 0.2, "weightedScore": 20, "details": "Exact specialization match in uiux" },
        "portfolio": { "score": 100, "weight": 0.2, "weightedScore": 20, "details": "1 matching verified case studies" },
        "industry": { "score": 100, "weight": 0.1, "weightedScore": 10, "details": "Domain experience in Healthcare" },
        "deliverables": { "score": 90, "weight": 0.1, "weightedScore": 9, "details": "3 of 3 target deliverables supported" },
        "budget": { "score": 100, "weight": 0.1, "weightedScore": 10, "details": "Talent rates align with project budget" },
        "availability": { "score": 100, "weight": 0.05, "weightedScore": 5, "details": "Available immediately" }
      }
    }
  }
  ```

---

## 2. Saved Items Endpoints

- `POST /api/saved/freelancers/:id`: Save a freelancer to shortlist (Returns 409 if already saved).
- `DELETE /api/saved/freelancers/:id`: Remove freelancer from shortlist.
- `GET /api/saved/freelancers`: List authenticated user's saved freelancers.
- `POST /api/saved/projects/:id`: Bookmark project brief (Returns 409 if already saved).
- `DELETE /api/saved/projects/:id`: Remove project from bookmarks.
- `GET /api/saved/projects`: List authenticated user's saved project briefs.

---

## 3. Project Invitations Workflow Endpoints

- `POST /api/invitations`: Send an invitation to a freelancer for an open brief.
  - Requires brief ownership (`403 Forbidden` if sender is not the brief owner).
  - Duplicate invitation prevented (`409 Conflict`).
- `GET /api/invitations`: List invitations (incoming for freelancers, outgoing for clients).
- `PUT /api/invitations/:id/accept` (or `POST`): Freelancer accepts invitation.
- `PUT /api/invitations/:id/decline` (or `POST`): Freelancer declines invitation.
- `PUT /api/invitations/:id/cancel` (or `POST`): Client cancels invitation.

