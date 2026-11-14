# FLOXA WORK — Phase 9: Discovery & Search Architecture

## 1. Executive Overview
FLOXA Work is a **Discovery-First Freelance Marketplace** and professional collaboration platform. Unlike conventional freelance directories that reduce talent search to generic keyword filters sorted by the lowest hourly rate, FLOXA Work treats discovery as an intelligent, bidirectional relationship between client project problems and specialized professional capabilities.

The Phase 9 Discovery Architecture provides:
1. **Client-to-Freelancer Discovery**: Sophisticated filtering across primary category, specializations, verified badge status, hourly rate brackets, availability status, and verified case studies.
2. **Freelancer-to-Project Discovery**: Project discovery across problem statements, deliverables required, sliders (Speed vs Craft, Proven vs Disruptive), budget parameters, and domain tags.
3. **Strict Privacy & Safe Projection**: Complete eradication of sensitive credentials (`passwordHash`, session tokens, reset tokens, internal file paths) from public discovery payloads.

---

## 2. Bidirectional Search Architecture

```
                    ┌────────────────────────────────────────┐
                    │          FLOXA Discovery Layer         │
                    └───────────────────┬────────────────────┘
                                        │
           ┌────────────────────────────┴───────────────────────────┐
           ▼                                                         ▼
┌──────────────────────────────┐                          ┌──────────────────────────────┐
│   Client Discovery Engine    │                          │  Freelancer Discovery Engine │
│                              │                          │                              │
│ • Filter by category         │                          │ • Filter by project category │
│ • Filter by specialization   │                          │ • Filter by budget range     │
│ • Filter by rate & capacity  │                          │ • Filter by required skills  │
│ • Verified badges & proof    │                          │ • Filter by deadline weeks   │
│ • 7-Dimension Matching       │                          │ • Save to Bookmarks          │
│ • Invite to Guided Brief     │                          │ • Submit Mini-Discovery      │
└──────────────┬───────────────┘                          └──────────────┬───────────────┘
               │                                                         │
               └────────────────────────────┬────────────────────────────┘
                                            ▼
                           ┌─────────────────────────────────┐
                           │      MongoDB Compound Indexes   │
                           │                                 │
                           │ • TalentProfile: category + rate│
                           │ • TalentProfile: text index     │
                           │ • Brief: category + budget      │
                           │ • Brief: text index on problem  │
                           │ • SavedItem: {userId, item, id} │
                           │ • Invitation: {brief, talent}   │
                           └─────────────────────────────────┘
```

---

## 3. Database Indexing & Query Optimizations
To support instantaneous sub-10ms discovery queries under production loads:
- **TalentProfile Indexing:**
  - Compound Index: `{ primaryCategory: 1, availabilityStatus: 1, hourlyRate: 1 }`
  - Text Index: `{ headline: "text", bio: "text", specializations: "text", skills: "text" }`
- **Brief Indexing:**
  - Compound Index: `{ category: 1, status: 1, budgetMin: 1, budgetMax: 1 }`
  - Text Index: `{ title: "text", problemStatement: "text", requiredSkills: "text" }`
- **Saved Items Indexing:**
  - Unique Compound Index: `{ userId: 1, itemType: 1, itemId: 1 }` preventing duplicate saves.
- **Invitations Indexing:**
  - Unique Compound Index: `{ briefId: 1, freelancerId: 1 }` ensuring clients cannot flood a freelancer with duplicate invitations for the same brief.

---

## 4. Non-Custodial Safety Guarantee
Discovery and invitations strictly observe the core non-custodial foundation of FLOXA Work:
- Search and matching engines evaluate strategic alignment, never escrow deposits or financial custody.
- Accepting a project invitation triggers real-time WebSocket communication and flags the candidate for evaluation; it **never** automatically creates a financial contract or disburses money.
- All contracts require explicit agreement on diagnostic deliverables, milestone roadmaps, and direct peer-to-peer external payment settlement.

