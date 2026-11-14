# FLOXA WORK — REPUTATION CALCULATION SPECIFICATION
## Mathematical Formulations, Sub-Score Aggregation & Isolation Rules

**Version:** 1.0.0  
**Date:** 14 November 2026  
**Status:** Production Standard  

---

## 1. Reputation Aggregation Engine

Reputation metrics are calculated deterministically by querying all records in the `reviews` collection satisfying:
```typescript
{
  targetId: userObjectId,
  status: 'published'
}
```

Any review in status `pending_mutual`, `flagged`, or `hidden` is strictly omitted from all computations.

---

## 2. Mathematical Formulations

Let $R = \{r_1, r_2, \dots, r_n\}$ be the set of $n$ published reviews targeting a user.

### 2.1 Overall Rating Average
$$\bar{O} = \begin{cases} 
5.00 & \text{if } n = 0 \\
\frac{1}{n} \sum_{i=1}^{n} r_i.\text{overallRating} & \text{if } n > 0 
\end{cases}$$

### 2.2 Category Sub-Scores
- **Communication Score:**
  $$\bar{C} = \frac{1}{n} \sum_{i=1}^{n} r_i.\text{communicationRating}$$
- **Quality of Work Score:**
  $$\bar{Q} = \frac{1}{n} \sum_{i=1}^{n} r_i.\text{qualityRating}$$
- **Reliability Score:**
  $$\bar{R} = \frac{1}{n} \sum_{i=1}^{n} r_i.\text{reliabilityRating}$$
- **Professionalism Score:**
  $$\bar{P} = \frac{1}{n} \sum_{i=1}^{n} r_i.\text{professionalismRating}$$

All averages are rounded to 2 decimal places.

### 2.3 Star Rating Distribution
For each star tier $k \in \{1, 2, 3, 4, 5\}$:
$$\text{count}_k = \sum_{i=1}^{n} \mathbb{I}(\text{round}(r_i.\text{overallRating}) = k)$$

---

## 3. Profile Persistence Targets

- **Freelancer (`TalentProfile`):**
  - `ratingAverage`: $\bar{O}$
  - `ratingCount`: $n$
  - `communicationScore`: $\bar{C}$
  - `qualityScore`: $\bar{Q}$
  - `reliabilityScore`: $\bar{R}$
  - `professionalismScore`: $\bar{P}$
  - `ratingBreakdown`: `{ fiveStar, fourStar, threeStar, twoStar, oneStar }`
  - `completedContractsCount`: Total completed contracts.

- **Client (`User`):**
  - `clientRatingAverage`: $\bar{O}$
  - `clientRatingCount`: $n$
  - `clientCompletedProjectsCount`: Total completed contracts.

---

## 4. Moderation Dynamism

When an administrator moderates a review:
1. If action is `'hide'`, status becomes `'hidden'`.
2. The aggregation engine automatically re-executes.
3. The hidden review is omitted from $R$, instantly removing its mathematical impact from the user's published scores.
