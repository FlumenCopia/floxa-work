# FLOXA WORK — Phase 9: Intelligent Matching Engine Algorithm

## 1. Algorithmic Principles & Philosophy
Conventional marketplace matching algorithms rely on opaque black-box scoring or simple price minimization. FLOXA Work's Intelligent Matching Engine is built on three core tenets:
1. **Explainability First:** Every calculated score is accompanied by human-readable explanations detailing exactly why the talent matches the brief.
2. **Multi-Dimensional Holistic Fit:** Capability is evaluated across technical competence, specialization, demonstrated case study evidence, industry familiarity, and realistic project bandwidth.
3. **Zero Hallucination:** Scoring is strictly calculated from verified database attributes.

---

## 2. Seven-Dimension Compatibility Formula

The total compatibility score \(S_{\text{overall}}\) is bounded between \(0\) and \(100\), calculated as:

\[
S_{\text{overall}} = \sum_{i=1}^{7} (W_i \times S_i)
\]

| Dimension | Weight (\(W_i\)) | Key Factors Evaluated |
| :--- | :--- | :--- |
| **1. Required Skills** | **25%** | Jaccard overlap between brief required skills and talent skill keywords + portfolio tech tags. |
| **2. Category & Specialization** | **20%** | Exact primary category match (100%), secondary specialization keyword overlap, or adjacent cross-disciplinary skillsets. |
| **3. Portfolio & Case Studies** | **20%** | Number and category depth of verified portfolio items matching the brief domain. |
| **4. Industry Experience** | **10%** | Overlap between client domain (FinTech, HealthTech, SaaS, etc.) and talent demonstrated project history. |
| **5. Deliverables Capability** | **10%** | Proportion of brief target deliverables matched by talent skills or prior case study outputs. |
| **6. Budget & Rate Compatibility** | **10%** | Alignment between brief budget ceiling and freelancer minimum project budget / standard rate. |
| **7. Availability & Capacity** | **5%** | Immediate availability status (`available` = 100%, `busy` = 50%, `not_looking` = 10%). |

---

## 3. Fit Tier Classification

The calculated composite score maps directly to descriptive fit tiers:

| Score Bracket | Fit Tier | Platform Meaning |
| :--- | :--- | :--- |
| **85 – 100%** | **Exceptional Fit** | Full skill overlap, exact category match, documented case study evidence, budget alignment, and immediate availability. |
| **75 – 84%** | **Strong Match** | High skill overlap, category alignment, and proven capabilities with minor variance. |
| **60 – 74%** | **Compatible Specialist** | Key required competencies satisfied; suitable for specific project components. |
| **45 – 59%** | **General Match** | Broad baseline competence; requires additional discovery interview to ensure exact alignment. |
| **0 – 44%** | **Low Overlap** | Significant divergence in required skills, core category, or budget parameters. |

---

## 4. Human-Readable Explanation Engine
Rather than presenting raw percentages in isolation, the matching engine generates transparent factual rationales, such as:
> *"Strong match based on 4 matching skills (Figma, UI/UX, Design Systems, React); verified specialization in UI/UX; 1 portfolio case study in matching problem domain; minimum project budget aligns with $3,000-$5,000 scope; available for immediate onboarding."*

