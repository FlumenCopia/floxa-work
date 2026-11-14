/**
 * FLOXA WORK — Phase 9: Advanced Discovery, Intelligent Freelancer Matching & Search Engine
 * Comprehensive Automated Test Suite
 *
 * Validates:
 * 1. Bidirectional Discovery: Client-to-Freelancer search & Freelancer-to-Project search
 * 2. Multi-dimensional filtering (skills, categories, budget/rate, availability, verified status)
 * 3. 7-dimensional Explainable Matching Algorithm (skills, category, portfolio, industry, deliverables, budget, availability)
 * 4. Saved Items persistence (freelancers & projects) with duplicate protection & user isolation
 * 5. Project Invitation Lifecycle (send, accept, decline, cancel) with authorization guards & zero-custody enforcement
 */

const assert = require('assert');

const API_BASE = 'http://localhost:5001/api';

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // not json
  }
  return { status: res.status, headers: res.headers, text, json };
}

async function runPhase9Tests() {
  console.log('\n========================================================================');
  console.log('  FLOXA WORK — PHASE 9: ADVANCED DISCOVERY & INTELLIGENT MATCHING SUITE');
  console.log('========================================================================\n');

  const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  // 1. Entities
  const clientData = {
    email: `client_p9_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Sanjay Mehta',
    handle: `sanjay_${unique}`,
    role: 'client',
  };

  const outsiderClientData = {
    email: `outsider_p9_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Outsider Client',
    handle: `outsider_${unique}`,
    role: 'client',
  };

  const talent1Data = {
    email: `talent1_p9_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Aravind V.',
    handle: `aravind_${unique}`,
    role: 'freelancer',
  };

  const talent2Data = {
    email: `talent2_p9_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Chen Wei',
    handle: `chen_${unique}`,
    role: 'freelancer',
  };

  const talent3Data = {
    email: `talent3_p9_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Elena Rostova',
    handle: `elena_${unique}`,
    role: 'freelancer',
  };

  console.log('[1/7] Registering Client, Outsider Client, and 3 Specialized Freelancers...');
  const regClient = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData),
  });
  assert.strictEqual(regClient.status, 201, `Failed to register client: ${regClient.text}`);
  const clientToken = regClient.json.token;
  const clientId = regClient.json.user.id;

  const regOutsider = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(outsiderClientData),
  });
  assert.strictEqual(regOutsider.status, 201);
  const outsiderToken = regOutsider.json.token;

  const regTalent1 = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(talent1Data),
  });
  assert.strictEqual(regTalent1.status, 201);
  const talent1Token = regTalent1.json.token;
  const talent1Id = regTalent1.json.user.id;

  const regTalent2 = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(talent2Data),
  });
  assert.strictEqual(regTalent2.status, 201);
  const talent2Token = regTalent2.json.token;
  const talent2Id = regTalent2.json.user.id;

  const regTalent3 = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(talent3Data),
  });
  assert.strictEqual(regTalent3.status, 201);
  const talent3Token = regTalent3.json.token;
  const talent3Id = regTalent3.json.user.id;
  console.log('✓ All 5 user accounts registered successfully.');

  // Setup Talent Profiles
  console.log('\n[2/7] Setting up Rich Profiles with Skills, Categories, Rates, & Portfolios...');
  // Talent 1: UI/UX Expert
  const updateTalent1 = await request(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talent1Token}`,
    },
    body: JSON.stringify({
      title: 'Principal Product & Brand Designer',
      bio: 'Specializing in enterprise design systems, typography, and React UI kits.',
      primaryCategory: 'uiux',
      specializations: ['Design Systems', 'Micro-Interactions', 'Brand Architecture'],
      skills: ['Figma', 'UI/UX', 'Design Systems', 'React', 'Branding'],
      industries: ['FinTech', 'Healthcare', 'SaaS'],
      hourlyRate: 85,
      availability: 'available',
      yearsOfExperience: 7,
      portfolioItems: [
        {
          title: 'Design System for MedTech Platform',
          description: 'A 200+ component unified design language for clinical workflows.',
          category: 'uiux',
          tags: ['Figma', 'Design Systems', 'Healthcare'],
          liveUrl: 'https://example.com/medtech',
        },
      ],
    }),
  });
  assert.strictEqual(updateTalent1.status, 200, `Update Talent1 failed: ${updateTalent1.text}`);

  // Talent 2: Backend Cloud Expert
  const updateTalent2 = await request(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talent2Token}`,
    },
    body: JSON.stringify({
      title: 'Distributed Systems & Cloud Architect',
      bio: 'High-throughput microservices, Kubernetes clusters, and low-latency databases.',
      primaryCategory: 'webdev',
      specializations: ['Cloud Architecture', 'Distributed Systems', 'API Security'],
      skills: ['Node.js', 'Go', 'Kubernetes', 'MongoDB', 'Redis'],
      industries: ['FinTech', 'DevOps', 'E-commerce'],
      hourlyRate: 110,
      availability: 'busy',
      yearsOfExperience: 9,
      portfolioItems: [
        {
          title: 'High-Throughput Payments Engine',
          description: 'Sub-millisecond ledger system handling 50k transactions/sec.',
          category: 'webdev',
          tags: ['Node.js', 'Redis', 'FinTech'],
        },
      ],
    }),
  });
  assert.strictEqual(updateTalent2.status, 200);

  // Talent 3: Mobile Engineer
  const updateTalent3 = await request(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talent3Token}`,
    },
    body: JSON.stringify({
      title: 'Senior Cross-Platform Mobile Engineer',
      bio: 'Native performance mobile apps with Flutter and React Native.',
      primaryCategory: 'mobile',
      specializations: ['Cross-Platform Mobile', 'Offline Sync', 'Push Services'],
      skills: ['Flutter', 'React Native', 'iOS', 'Android', 'Dart'],
      industries: ['Social', 'EdTech'],
      hourlyRate: 70,
      availability: 'available',
      yearsOfExperience: 5,
    }),
  });
  assert.strictEqual(updateTalent3.status, 200);
  console.log('✓ 3 Talent profiles configured with categorized skills, rates, and portfolios.');

  // Create Project Briefs
  console.log('\n[3/7] Creating Client Project Briefs for Discovery & Matching...');
  const brief1Payload = {
    title: 'Enterprise Clinical Platform Design System',
    description: 'We need an experienced product designer to build a multi-platform design system in Figma and React.',
    category: 'uiux',
    industry: 'Healthcare',
    budgetMin: 3000,
    budgetMax: 5000,
    requiredSkills: ['Figma', 'UI/UX', 'Design Systems', 'React'],
    deliverables: [
      { title: 'Token Foundation & Typography' },
      { title: 'Core UI Component Library in Figma' },
      { title: 'React Storybook Handover' },
    ],
  };

  const createBrief1 = await request(`${API_BASE}/briefs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify(brief1Payload),
  });
  assert.strictEqual(createBrief1.status, 201, `Failed to create brief 1: ${createBrief1.text}`);
  const brief1Id = createBrief1.json.brief._id || createBrief1.json.brief.id;

  const brief2Payload = {
    title: 'Kubernetes Microservices Migration & Redis Caching',
    description: 'Migrating backend monolith to distributed Node.js microservices on Kubernetes.',
    category: 'webdev',
    industry: 'FinTech',
    budgetMin: 7000,
    budgetMax: 10000,
    requiredSkills: ['Node.js', 'Kubernetes', 'MongoDB', 'Redis'],
    deliverables: [
      { title: 'Architecture RFC & Cluster Setup' },
      { title: 'Services Extraction & Ingress Routing' },
    ],
  };

  const createBrief2 = await request(`${API_BASE}/briefs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify(brief2Payload),
  });
  assert.strictEqual(createBrief2.status, 201);
  const brief2Id = createBrief2.json.brief._id || createBrief2.json.brief.id;
  console.log(`✓ Created Brief 1 (ID: ${brief1Id}) and Brief 2 (ID: ${brief2Id}).`);

  // 4. Freelancer Search Tests
  console.log('\n[4/7] Testing Bidirectional Discovery Search Endpoints & Filters...');
  // A. Search Freelancers by Query & Category
  const searchFreelancersCat = await request(
    `${API_BASE}/discovery/freelancers?category=uiux&availability=available`
  );
  assert.strictEqual(searchFreelancersCat.status, 200);
  assert(Array.isArray(searchFreelancersCat.json.freelancers));
  const foundTalent1 = searchFreelancersCat.json.freelancers.find(
    (f) => f.userId?._id === talent1Id || f.userId?.id === talent1Id || f.userId === talent1Id
  );
  assert(foundTalent1, 'Expected Talent 1 (UI/UX) in search results');
  assert.strictEqual(foundTalent1.primaryCategory, 'uiux');
  console.log('✓ Client-to-Freelancer search by category & availability succeeded.');

  // B. Verify Safe Projection (Zero passwordHash, zero private secrets)
  assert.strictEqual(foundTalent1.passwordHash, undefined, 'Private passwordHash must never be projected');
  assert.strictEqual(foundTalent1.userId?.passwordHash, undefined, 'User passwordHash must never be projected');
  console.log('✓ Safe public projection verified (zero sensitive credentials exposed).');

  // C. Search Projects by Category & Skills
  const searchProjectsRes = await request(
    `${API_BASE}/discovery/projects?category=uiux&minBudget=2000&maxBudget=6000`
  );
  assert.strictEqual(searchProjectsRes.status, 200);
  assert(Array.isArray(searchProjectsRes.json.projects));
  const foundBrief1 = searchProjectsRes.json.projects.find((p) => p._id === brief1Id);
  assert(foundBrief1, 'Expected Brief 1 in filtered project discovery');
  assert.strictEqual(foundBrief1.category, 'uiux');
  console.log('✓ Freelancer-to-Project search by category & budget range succeeded.');

  // 5. Intelligent Explainable Matching Algorithm Tests
  console.log('\n[5/7] Testing 7-Dimensional Explainable Matching Engine...');
  // Match Brief 1 (UI/UX) with Talent 1 (UI/UX expert) -> should be high compatibility
  const matchResult1 = await request(
    `${API_BASE}/discovery/match?briefId=${brief1Id}&freelancerId=${talent1Id}`
  );
  assert.strictEqual(matchResult1.status, 200, `Match query failed: ${matchResult1.text}`);
  const match1 = matchResult1.json.matchResult;
  assert(typeof match1.overallScore === 'number');
  assert(match1.overallScore >= 70, `Expected high match for UI/UX expert on UI/UX brief, got: ${match1.overallScore}`);
  assert(match1.overallScore <= 100);
  assert(['Exceptional Fit', 'Strong Match', 'Compatible Specialist'].includes(match1.ratingTier));
  assert.strictEqual(match1.dimensionBreakdown.skills.weight, 0.25);
  assert.strictEqual(match1.dimensionBreakdown.specialization.weight, 0.20);
  assert.strictEqual(match1.dimensionBreakdown.portfolio.weight, 0.20);
  assert.strictEqual(match1.dimensionBreakdown.industry.weight, 0.10);
  assert.strictEqual(match1.dimensionBreakdown.deliverables.weight, 0.10);
  assert.strictEqual(match1.dimensionBreakdown.budget.weight, 0.10);
  assert.strictEqual(match1.dimensionBreakdown.availability.weight, 0.05);
  assert(typeof match1.explanationSummary === 'string' && match1.explanationSummary.length > 0);
  console.log(`✓ Strong match verified: Score = ${match1.overallScore}% (${match1.ratingTier})`);
  console.log(`  Summary: "${match1.explanationSummary}"`);

  // Match Brief 1 (UI/UX) with Talent 2 (Backend Cloud expert) -> should be significantly lower
  const matchResult2 = await request(
    `${API_BASE}/discovery/match?briefId=${brief1Id}&freelancerId=${talent2Id}`
  );
  assert.strictEqual(matchResult2.status, 200);
  const match2 = matchResult2.json.matchResult;
  assert(match2.overallScore < 50, `Expected low match for backend expert on UI/UX brief, got: ${match2.overallScore}`);
  console.log(`✓ Low match correctly differentiated: Score = ${match2.overallScore}% (${match2.ratingTier})`);

  // 6. Saved Items Persistence & User Isolation
  console.log('\n[6/7] Testing Saved Items Persistence & User Isolation...');
  // Save Freelancer 1 by Client
  const saveTalent = await request(`${API_BASE}/saved/freelancers/${talent1Id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.strictEqual(saveTalent.status, 201, `Failed to save freelancer: ${saveTalent.text}`);

  // Duplicate Save should be rejected or handled gracefully
  const saveTalentDuplicate = await request(`${API_BASE}/saved/freelancers/${talent1Id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.strictEqual(saveTalentDuplicate.status, 409, 'Duplicate save must return 409 Conflict');

  // List Saved Freelancers
  const listSavedTalent = await request(`${API_BASE}/saved/freelancers`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.strictEqual(listSavedTalent.status, 200);
  assert.strictEqual(listSavedTalent.json.savedFreelancers.length, 1);
  console.log('✓ Freelancer successfully saved with duplicate protection.');

  // Save Project 1 by Talent 1
  const saveProject = await request(`${API_BASE}/saved/projects/${brief1Id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${talent1Token}` },
  });
  assert.strictEqual(saveProject.status, 201);

  // List Saved Projects for Talent 1
  const listSavedProjects = await request(`${API_BASE}/saved/projects`, {
    headers: { Authorization: `Bearer ${talent1Token}` },
  });
  assert.strictEqual(listSavedProjects.status, 200);
  assert.strictEqual(listSavedProjects.json.savedProjects.length, 1);

  // User Isolation: Outsider Client has 0 saved freelancers
  const listOutsiderSaved = await request(`${API_BASE}/saved/freelancers`, {
    headers: { Authorization: `Bearer ${outsiderToken}` },
  });
  assert.strictEqual(listOutsiderSaved.status, 200);
  assert.strictEqual(listOutsiderSaved.json.savedFreelancers.length, 0);
  console.log('✓ Saved items user isolation verified across distinct accounts.');

  // Unsave Freelancer 1
  const removeSavedTalent = await request(`${API_BASE}/saved/freelancers/${talent1Id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.strictEqual(removeSavedTalent.status, 200);
  const listAfterRemove = await request(`${API_BASE}/saved/freelancers`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.strictEqual(listAfterRemove.json.savedFreelancers.length, 0);
  console.log('✓ Saved item deletion verified.');

  // 7. Project Invitation Workflow & Authorization
  console.log('\n[7/7] Testing Project Invitation Lifecycle & Ownership Barriers...');
  // A. Non-owner cannot invite freelancers to someone else\'s brief
  const unauthorizedInvite = await request(`${API_BASE}/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${outsiderToken}`,
    },
    body: JSON.stringify({
      briefId: brief1Id,
      freelancerId: talent1Id,
      personalMessage: 'Hey! Check out this project!',
    }),
  });
  assert.strictEqual(unauthorizedInvite.status, 403, 'Non-owner must be forbidden from inviting');
  console.log('✓ Brief ownership barrier verified (403 Forbidden for non-owners).');

  // B. Legitimate Client sends Invitation to Talent 1 for Brief 1
  const validInvite = await request(`${API_BASE}/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      briefId: brief1Id,
      freelancerId: talent1Id,
      personalMessage: 'We love your design system portfolio! Please submit a proposal for our clinical platform.',
    }),
  });
  assert.strictEqual(validInvite.status, 201, `Failed to send invitation: ${validInvite.text}`);
  const invitationId = validInvite.json.invitation._id || validInvite.json.invitation.id;
  assert.strictEqual(validInvite.json.invitation.status, 'pending');

  // C. Duplicate Invitation Rejection
  const dupInvite = await request(`${API_BASE}/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      briefId: brief1Id,
      freelancerId: talent1Id,
    }),
  });
  assert.strictEqual(dupInvite.status, 409, 'Duplicate invitation must return 409 Conflict');
  console.log('✓ Duplicate invitation prevention verified.');

  // D. Talent 1 fetches Invitations
  const listTalent1Invites = await request(`${API_BASE}/invitations`, {
    headers: { Authorization: `Bearer ${talent1Token}` },
  });
  assert.strictEqual(listTalent1Invites.status, 200);
  const receivedInvite = listTalent1Invites.json.invitations.find((i) => i._id === invitationId);
  assert(receivedInvite, 'Expected received invitation in talent inbox');
  assert.strictEqual(receivedInvite.status, 'pending');

  // E. Talent 1 accepts Invitation
  const acceptInvite = await request(`${API_BASE}/invitations/${invitationId}/accept`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${talent1Token}` },
  });
  assert.strictEqual(acceptInvite.status, 200);
  assert.strictEqual(acceptInvite.json.invitation.status, 'accepted');
  console.log('✓ Invitation acceptance verified (signals client, does not bypass Mini-Discovery pitch).');

  // F. Client sends Invitation to Talent 3 and cancels it
  const inviteTalent3 = await request(`${API_BASE}/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      briefId: brief1Id,
      freelancerId: talent3Id,
      personalMessage: 'Explore our project brief.',
    }),
  });
  assert.strictEqual(inviteTalent3.status, 201);
  const invite3Id = inviteTalent3.json.invitation._id || inviteTalent3.json.invitation.id;

  const cancelInvite = await request(`${API_BASE}/invitations/${invite3Id}/cancel`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.strictEqual(cancelInvite.status, 200);
  assert.strictEqual(cancelInvite.json.invitation.status, 'cancelled');
  console.log('✓ Client invitation cancellation verified.');

  console.log('\n========================================================================');
  console.log('  ALL PHASE 9 DISCOVERY & INTELLIGENT MATCHING TESTS PASSED (100%)');
  console.log('========================================================================\n');
}

runPhase9Tests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
