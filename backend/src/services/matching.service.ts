/**
 * FLOXA WORK — Intelligent Matching Engine Service
 * Transparent, explainable compatibility evaluation between discovery briefs and talent profiles.
 */

export interface MatchDimensionBreakdown {
  score: number;
  weight: number;
  weightedScore: number;
  details: string;
}

export interface MatchResult {
  overallScore: number; // 0 - 100
  ratingTier: 'Exceptional Fit' | 'Strong Match' | 'Compatible Specialist' | 'General Match' | 'Low Overlap';
  matchingSkills: string[];
  missingSkills: string[];
  categoryMatch: boolean;
  budgetAligned: boolean;
  availabilityStatus: string;
  portfolioEvidenceCount: number;
  explanationSummary: string;
  dimensionBreakdown: {
    skills: MatchDimensionBreakdown;
    specialization: MatchDimensionBreakdown;
    portfolio: MatchDimensionBreakdown;
    industry: MatchDimensionBreakdown;
    deliverables: MatchDimensionBreakdown;
    budget: MatchDimensionBreakdown;
    availability: MatchDimensionBreakdown;
  };
}

export function calculateCompatibility(brief: any, talent: any): MatchResult {
  if (!brief || !talent) {
    return {
      overallScore: 0,
      ratingTier: 'Low Overlap',
      matchingSkills: [],
      missingSkills: [],
      categoryMatch: false,
      budgetAligned: false,
      availabilityStatus: 'unknown',
      portfolioEvidenceCount: 0,
      explanationSummary: 'Insufficient profile or brief data to evaluate compatibility.',
      dimensionBreakdown: {
        skills: { score: 0, weight: 0.25, weightedScore: 0, details: 'No data' },
        specialization: { score: 0, weight: 0.20, weightedScore: 0, details: 'No data' },
        portfolio: { score: 0, weight: 0.20, weightedScore: 0, details: 'No data' },
        industry: { score: 0, weight: 0.10, weightedScore: 0, details: 'No data' },
        deliverables: { score: 0, weight: 0.10, weightedScore: 0, details: 'No data' },
        budget: { score: 0, weight: 0.10, weightedScore: 0, details: 'No data' },
        availability: { score: 0, weight: 0.05, weightedScore: 0, details: 'No data' },
      },
    };
  }

  // 1. Skill Compatibility (25%)
  const briefSkills: string[] = brief.requiredSkills && brief.requiredSkills.length > 0
    ? brief.requiredSkills.map((s: string) => s.toLowerCase().trim())
    : (brief.deliverablesRequired || []).map((d: string) => d.toLowerCase().trim());

  const talentSkills: string[] = (talent.skills || []).map((s: string) => s.toLowerCase().trim());
  const talentPortfolioTech: string[] = (talent.portfolioItems || []).flatMap((p: any) =>
    (p.techOrSkills || []).map((t: string) => t.toLowerCase().trim())
  );
  const allTalentSkills = new Set([...talentSkills, ...talentPortfolioTech]);

  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];

  if (briefSkills.length > 0) {
    briefSkills.forEach((bSkill) => {
      const match = Array.from(allTalentSkills).find((tSkill) =>
        tSkill.includes(bSkill) || bSkill.includes(tSkill)
      );
      if (match) {
        matchingSkills.push(bSkill);
      } else {
        missingSkills.push(bSkill);
      }
    });
  } else {
    // If no explicit skills required, match against category
    matchingSkills.push(...talentSkills.slice(0, 3));
  }

  const skillScore = briefSkills.length > 0
    ? Math.round((matchingSkills.length / briefSkills.length) * 100)
    : talentSkills.length > 0 ? 80 : 50;

  // 2. Specialization / Category Compatibility (20%)
  const briefCategory = (brief.category || '').toLowerCase();
  const talentPrimaryCategory = (talent.primaryCategory || '').toLowerCase();
  const talentSpecializations = (talent.specializations || []).map((s: string) => s.toLowerCase());

  let categoryMatch = false;
  let specScore = 40; // baseline

  if (talentPrimaryCategory === briefCategory) {
    categoryMatch = true;
    specScore = 100;
  } else if (talentSpecializations.some((s: string) => s.includes(briefCategory) || briefCategory.includes(s))) {
    categoryMatch = true;
    specScore = 85;
  } else if (talent.headline?.toLowerCase().includes(briefCategory)) {
    specScore = 70;
  }

  // 3. Portfolio Relevance (20%)
  const portfolioItems = talent.portfolioItems || [];
  const portfolioLinks = talent.portfolioLinks || [];
  let portfolioEvidenceCount = 0;

  portfolioItems.forEach((item: any) => {
    const itemCat = (item.category || '').toLowerCase();
    const itemDesc = (item.description || '').toLowerCase();
    if (itemCat.includes(briefCategory) || itemDesc.includes(briefCategory) || matchingSkills.some((s) => itemDesc.includes(s))) {
      portfolioEvidenceCount++;
    }
  });

  let portScore = 30;
  if (portfolioEvidenceCount >= 2) portScore = 100;
  else if (portfolioEvidenceCount === 1) portScore = 80;
  else if (portfolioItems.length > 0 || portfolioLinks.length > 0) portScore = 60;

  // 4. Industry Experience (10%)
  const briefIndustry = (brief.industry || '').toLowerCase();
  const talentIndustries = (talent.industries || []).map((ind: string) => ind.toLowerCase());
  let indScore = 50;

  if (briefIndustry) {
    if (talentIndustries.some((ind: string) => ind.includes(briefIndustry) || briefIndustry.includes(ind))) {
      indScore = 100;
    } else if (talent.bio?.toLowerCase().includes(briefIndustry) || talent.headline?.toLowerCase().includes(briefIndustry)) {
      indScore = 75;
    } else {
      indScore = 35;
    }
  } else {
    indScore = 80; // Not a limiting constraint
  }

  // 5. Project-Type & Deliverables Compatibility (10%)
  const deliverables = brief.deliverablesRequired || [];
  let delivMatches = 0;
  deliverables.forEach((deliv: string) => {
    const dLower = deliv.toLowerCase();
    if (
      talent.bio?.toLowerCase().includes(dLower) ||
      talent.headline?.toLowerCase().includes(dLower) ||
      talentSkills.some((s: string) => s.includes(dLower) || dLower.includes(s))
    ) {
      delivMatches++;
    }
  });
  const delivScore = deliverables.length > 0
    ? Math.min(100, Math.round((delivMatches / deliverables.length) * 100) + 40)
    : 75;

  // 6. Budget Compatibility (10%)
  const budgetMin = Number(brief.budgetMin || 500);
  const budgetMax = Number(brief.budgetMax || 5000);
  const talentMinBudget = Number(talent.minimumProjectBudget || 500);
  const talentHourlyRate = Number(talent.hourlyRate || 80);

  let budgetScore = 70;
  let budgetAligned = false;

  if (talentMinBudget <= budgetMax) {
    budgetAligned = true;
    budgetScore = 100;
  } else if (talentMinBudget <= budgetMax * 1.25) {
    budgetAligned = true;
    budgetScore = 75;
  } else {
    budgetScore = Math.max(30, Math.round((budgetMax / talentMinBudget) * 100));
  }

  // 7. Availability Compatibility (5%)
  const availStatus = talent.availabilityStatus || 'available';
  let availScore = 50;
  if (availStatus === 'available') availScore = 100;
  else if (availStatus === 'busy') availScore = 50;
  else if (availStatus === 'not_looking') availScore = 10;

  // Calculate Weighted Overall Score
  const weights = {
    skills: 0.25,
    specialization: 0.20,
    portfolio: 0.20,
    industry: 0.10,
    deliverables: 0.10,
    budget: 0.10,
    availability: 0.05,
  };

  const rawScore =
    skillScore * weights.skills +
    specScore * weights.specialization +
    portScore * weights.portfolio +
    indScore * weights.industry +
    delivScore * weights.deliverables +
    budgetScore * weights.budget +
    availScore * weights.availability;

  const overallScore = Math.min(100, Math.max(10, Math.round(rawScore)));

  // Tier classification
  let ratingTier: MatchResult['ratingTier'] = 'General Match';
  if (overallScore >= 85) ratingTier = 'Exceptional Fit';
  else if (overallScore >= 75) ratingTier = 'Strong Match';
  else if (overallScore >= 60) ratingTier = 'Compatible Specialist';
  else if (overallScore >= 45) ratingTier = 'General Match';
  else ratingTier = 'Low Overlap';

  // Construct Transparent Factual Explanation
  const explanations: string[] = [];
  if (matchingSkills.length > 0) {
    explanations.push(`${matchingSkills.length} matching skills (${matchingSkills.slice(0, 3).join(', ')})`);
  }
  if (categoryMatch) {
    explanations.push(`verified specialization in ${briefCategory}`);
  }
  if (portfolioEvidenceCount > 0) {
    explanations.push(`${portfolioEvidenceCount} portfolio case studies in matching problem domain`);
  }
  if (budgetAligned) {
    explanations.push(`minimum project budget aligns with $${budgetMin.toLocaleString()}-$${budgetMax.toLocaleString()} scope`);
  }
  if (availStatus === 'available') {
    explanations.push('available for immediate onboarding');
  }

  const explanationSummary = explanations.length > 0
    ? `Strong match based on ${explanations.join('; ')}.`
    : `General compatibility across ${briefCategory} project scope.`;

  return {
    overallScore,
    ratingTier,
    matchingSkills,
    missingSkills,
    categoryMatch,
    budgetAligned,
    availabilityStatus: availStatus,
    portfolioEvidenceCount,
    explanationSummary,
    dimensionBreakdown: {
      skills: {
        score: skillScore,
        weight: weights.skills,
        weightedScore: Math.round(skillScore * weights.skills),
        details: `${matchingSkills.length} of ${briefSkills.length || 1} required skills matched`,
      },
      specialization: {
        score: specScore,
        weight: weights.specialization,
        weightedScore: Math.round(specScore * weights.specialization),
        details: categoryMatch ? `Exact specialization match in ${briefCategory}` : `General alignment in ${talentPrimaryCategory || 'consulting'}`,
      },
      portfolio: {
        score: portScore,
        weight: weights.portfolio,
        weightedScore: Math.round(portScore * weights.portfolio),
        details: `${portfolioEvidenceCount} matching verified case studies`,
      },
      industry: {
        score: indScore,
        weight: weights.industry,
        weightedScore: Math.round(indScore * weights.industry),
        details: briefIndustry ? `Domain experience in ${briefIndustry}` : 'Cross-industry compatibility',
      },
      deliverables: {
        score: delivScore,
        weight: weights.deliverables,
        weightedScore: Math.round(delivScore * weights.deliverables),
        details: `${delivMatches} of ${deliverables.length || 1} target deliverables supported`,
      },
      budget: {
        score: budgetScore,
        weight: weights.budget,
        weightedScore: Math.round(budgetScore * weights.budget),
        details: budgetAligned ? 'Talent rates align with project budget' : 'Budget variance noted',
      },
      availability: {
        score: availScore,
        weight: weights.availability,
        weightedScore: Math.round(availScore * weights.availability),
        details: availStatus === 'available' ? 'Available immediately' : `Status: ${availStatus}`,
      },
    },
  };
}

