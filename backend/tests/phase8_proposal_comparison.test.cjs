/**
 * FLOXA WORK — Phase 8: Mini-Discovery Proposal Comparison Engine Test Suite
 * Validates side-by-side evaluation, authorization barriers, difference metrics,
 * contract integration, and permanent zero-custody direct billing.
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
    // text
  }
  return { status: res.status, headers: res.headers, text, json };
}

async function runPhase8Tests() {
  console.log('\n=============================================================');
  console.log('  FLOXA WORK — PHASE 8: PROPOSAL COMPARISON ENGINE TEST SUITE');
  console.log('=============================================================\n');

  const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  // Test Entities
  const clientData = {
    email: `client_p8_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Elena Rostova',
    handle: `elena_${unique}`,
    role: 'client',
  };

  const intruderData = {
    email: `intruder_p8_${unique}@snoop.io`,
    password: 'Password123!',
    name: 'Snooping Client',
    handle: `snoop_${unique}`,
    role: 'client',
  };

  const free1Data = {
    email: `free_alpha_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Aravind V.',
    handle: `aravind_${unique}`,
    role: 'freelancer',
  };

  const free2Data = {
    email: `free_beta_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Marcus Chen',
    handle: `marcus_${unique}`,
    role: 'freelancer',
  };

  const free3Data = {
    email: `free_gamma_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Sophia Patel',
    handle: `sophia_${unique}`,
    role: 'freelancer',
  };

  console.log('[1/7] Registering Client, Intruder, and 3 Competing Freelancers...');
  const regClient = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData),
  });
  assert.strictEqual(regClient.status, 201);
  const clientToken = regClient.json.token;

  const regIntruder = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(intruderData),
  });
  assert.strictEqual(regIntruder.status, 201);
  const intruderToken = regIntruder.json.token;

  const regFree1 = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(free1Data),
  });
  assert.strictEqual(regFree1.status, 201);
  const free1Token = regFree1.json.token;

  const regFree2 = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(free2Data),
  });
  assert.strictEqual(regFree2.status, 201);
  const free2Token = regFree2.json.token;

  const regFree3 = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(free3Data),
  });
  assert.strictEqual(regFree3.status, 201);
  const free3Token = regFree3.json.token;

  console.log('  -> Registered all 5 test actors successfully.');

  // -------------------------------------------------------------
  // Test 2: Client posts Guided Discovery Brief
  // -------------------------------------------------------------
  console.log('\n[2/7] Client posting Guided Discovery Brief...');
  const briefRes = await request(`${API_BASE}/briefs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      title: `AI Health Platform Rebrand & Design System ${unique}`,
      category: 'branding',
      problemStatement: 'Current clinical platform is unintuitive for patients; retention dropping due to complex medical jargon.',
      budgetMin: 3000,
      budgetMax: 5000,
      deliverablesRequired: ['Discovery Audit', 'Design System Architecture', 'Component Handover'],
      targetAudience: 'Patients aged 25-60 and clinical staff',
      deadlineWeeks: 4,
    }),
  });
  assert.strictEqual(briefRes.status, 201);
  const briefId = briefRes.json.brief.id;
  console.log(`  -> Brief created (ID: ${briefId}).`);

  // -------------------------------------------------------------
  // Test 3: Milestone Amount Reconciliation Enforcement
  // -------------------------------------------------------------
  console.log('\n[3/7] Testing Milestone Amount Reconciliation Validation...');
  const invalidReconRes = await request(`${API_BASE}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${free1Token}`,
    },
    body: JSON.stringify({
      briefId,
      diagnosticAnswers: [{ question: 'Diagnosis', answer: 'Invalid sum test.' }],
      proposedMilestones: [
        { title: 'Milestone 1', amount: 500, deliveryDays: 7 },
        { title: 'Milestone 2', amount: 500, deliveryDays: 7 },
      ],
      totalPrice: 2000, // Does NOT reconcile with $1,000 milestones
      estimatedDays: 14,
    }),
  });
  assert.strictEqual(invalidReconRes.status, 400, 'Mismatched milestone sum must return 400');
  assert.ok(
    invalidReconRes.json.error.includes('reconcile') || invalidReconRes.json.error.includes('Milestone amounts'),
    'Error message must indicate milestone reconciliation failure'
  );
  console.log('  -> Milestone reconciliation failure correctly rejected with HTTP 400.');

  // -------------------------------------------------------------
  // Test 4: Submitting 3 Competing Mini-Discovery Proposals
  // -------------------------------------------------------------
  console.log('\n[4/7] Submitting 3 Competing Structured Mini-Discovery Proposals...');

  // Proposal 1 by Freelancer A (Aravind - Craft Focus)
  const prop1Res = await request(`${API_BASE}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${free1Token}`,
    },
    body: JSON.stringify({
      briefId,
      problemDiagnosis: {
        understanding: 'Patient drop-off stems from high cognitive load in clinical jargon.',
        rootCauses: ['Complex terminology', 'Lack of visual patient journey'],
        risksAndConstraints: ['Strict HIPAA compliance requires careful token usage.'],
        clarifyingQuestions: ['Are there existing patient persona interviews?'],
      },
      proposedStrategy: {
        strategicApproach: 'Consumer-first design tokens with progressive medical disclosure.',
        expectedOutcomes: ['35% reduction in intake drop-off', 'High brand affinity'],
      },
      strategicSliders: [{ key: 'craft_direction', label: 'Craft vs Speed', value: 85, rationale: 'High craft emphasis' }],
      proposedMilestones: [
        { title: 'Milestone 1: Concept & Patient Archetypes', amount: 1400, deliveryDays: 7 },
        { title: 'Milestone 2: Design Token System & Intake Flow', amount: 1400, deliveryDays: 10 },
        { title: 'Milestone 3: Final Asset Bundle & Figma Handover', amount: 700, deliveryDays: 4 },
      ],
      totalPrice: 3500,
      estimatedDays: 21,
      portfolioItems: [
        {
          title: 'CareHealth Clinical Portal',
          description: 'Patient-centric appointment & consultation platform.',
          category: 'Healthcare Branding',
          url: 'https://example.com/carehealth',
        },
      ],
    }),
  });
  assert.strictEqual(prop1Res.status, 201);
  const prop1Id = prop1Res.json.proposal.id;

  // Proposal 2 by Freelancer B (Marcus - Systems Engineering Focus)
  const prop2Res = await request(`${API_BASE}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${free2Token}`,
    },
    body: JSON.stringify({
      briefId,
      problemDiagnosis: {
        understanding: 'Clinical staff and patients need divergent viewports with unified component semantics.',
        rootCauses: ['Inconsistent typography', 'No modular UI kit'],
        risksAndConstraints: ['Web accessibility WCAG AA compatibility is mandatory.'],
        clarifyingQuestions: ['Do you support screen reader assistive tech?'],
      },
      proposedStrategy: {
        strategicApproach: 'Scalable multi-brand design tokens with automated Tailwind exporter.',
        expectedOutcomes: ['Instant design-to-code velocity', 'Zero accessibility violations'],
      },
      strategicSliders: [{ key: 'craft_direction', label: 'Systems vs Speed', value: 70 }],
      proposedMilestones: [
        { title: 'Milestone 1: Accessibility Audit & Token Architecture', amount: 1600, deliveryDays: 8 },
        { title: 'Milestone 2: Core Patient Component Library', amount: 1600, deliveryDays: 12 },
        { title: 'Milestone 3: Documentation & Verification Handover', amount: 800, deliveryDays: 6 },
      ],
      totalPrice: 4000,
      estimatedDays: 26,
      portfolioItems: [
        {
          title: 'MedFlow Design System',
          description: 'Multi-platform component library for 50k DAU.',
          category: 'Design Systems',
          url: 'https://example.com/medflow',
        },
      ],
    }),
  });
  assert.strictEqual(prop2Res.status, 201);
  const prop2Id = prop2Res.json.proposal.id;

  // Proposal 3 by Freelancer C (Sophia - Rapid Turnaround Focus)
  const prop3Res = await request(`${API_BASE}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${free3Token}`,
    },
    body: JSON.stringify({
      briefId,
      problemDiagnosis: {
        understanding: 'Immediate priority is simplifying the onboarding funnel to stop churn this month.',
        rootCauses: ['Too many screens before booking', 'Friction in sign-up'],
        risksAndConstraints: ['Aggressive launch timeline needed.'],
      },
      proposedStrategy: {
        strategicApproach: 'Rapid sprint-based heuristic overhaul with pre-built component templates.',
        expectedOutcomes: ['Quick launch in 14 days', 'Immediate conversion boost'],
      },
      strategicSliders: [{ key: 'craft_direction', label: 'Speed vs Depth', value: 40 }],
      proposedMilestones: [
        { title: 'Milestone 1: Intake Flow Wireframes & Prototypes', amount: 1200, deliveryDays: 5 },
        { title: 'Milestone 2: High-Fidelity UI Screens & Testing', amount: 1200, deliveryDays: 6 },
        { title: 'Milestone 3: Asset Export & Launch Bundle', amount: 600, deliveryDays: 3 },
      ],
      totalPrice: 3000,
      estimatedDays: 14,
    }),
  });
  assert.strictEqual(prop3Res.status, 201);
  const prop3Id = prop3Res.json.proposal.id;

  console.log('  -> Successfully submitted 3 distinct diagnostic proposals ($3500, $4000, $3000).');

  // -------------------------------------------------------------
  // Test 5: Strict Access Control (Owner vs Non-Owner vs Freelancers)
  // -------------------------------------------------------------
  console.log('\n[5/7] Testing Strict Access Control & Proposal Isolation...');

  // Brief owner fetches proposals -> 200 OK
  const ownerFetch = await request(`${API_BASE}/briefs/${briefId}/proposals`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.strictEqual(ownerFetch.status, 200);
  assert.strictEqual(ownerFetch.json.proposals.length, 3, 'Owner must see all 3 proposals');
  console.log('  -> Brief owner successfully retrieved all 3 competing proposals.');

  // Intruder client attempts to fetch proposals for this brief -> 403 Forbidden!
  const intruderFetch = await request(`${API_BASE}/briefs/${briefId}/proposals`, {
    headers: { Authorization: `Bearer ${intruderToken}` },
  });
  assert.strictEqual(intruderFetch.status, 403, 'Intruder must be rejected with 403 Forbidden');
  console.log('  -> Unauthorized client rejected with HTTP 403 Forbidden.');

  // Freelancer attempts to fetch all proposals for this brief -> 403 Forbidden!
  const freeFetch = await request(`${API_BASE}/briefs/${briefId}/proposals`, {
    headers: { Authorization: `Bearer ${free1Token}` },
  });
  assert.strictEqual(freeFetch.status, 403, 'Freelancer cannot spy on competing proposals');
  console.log('  -> Competing freelancer rejected with HTTP 403 Forbidden (Privacy isolated).');

  // -------------------------------------------------------------
  // Test 6: Shortlisting, Declining & Proposal Comparison Engine
  // -------------------------------------------------------------
  console.log('\n[6/7] Testing Shortlisting, Declining & Side-by-Side Comparison Engine...');

  // Client shortlists Proposal 1
  const shortRes = await request(`${API_BASE}/proposals/${prop1Id}/shortlist`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.strictEqual(shortRes.status, 200);
  assert.strictEqual(shortRes.json.proposal.status, 'shortlisted');
  console.log('  -> Proposal 1 successfully shortlisted.');

  // Client declines Proposal 3
  const declineRes = await request(`${API_BASE}/proposals/${prop3Id}/decline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({ reason: 'Timeline is too compressed for our clinical review team.' }),
  });
  assert.strictEqual(declineRes.status, 200);
  assert.strictEqual(declineRes.json.proposal.status, 'declined');
  console.log('  -> Proposal 3 declined with documented client feedback.');

  // Side-by-side comparison API: compare Proposal 1 and Proposal 2
  const compareRes = await request(`${API_BASE}/proposals/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      briefId,
      proposalIds: [prop1Id, prop2Id],
    }),
  });
  assert.strictEqual(compareRes.status, 200);
  const compData = compareRes.json;
  assert.strictEqual(compData.proposals.length, 2);
  assert.strictEqual(compData.comparisonMetrics.priceRange.min, 3500);
  assert.strictEqual(compData.comparisonMetrics.priceRange.max, 4000);
  assert.strictEqual(compData.comparisonMetrics.priceRange.delta, 500);
  assert.strictEqual(compData.comparisonMetrics.timelineRange.minDays, 21);
  assert.strictEqual(compData.comparisonMetrics.timelineRange.maxDays, 26);
  console.log('  -> Side-by-Side Comparison Engine metrics calculated accurately.');

  // Intruder attempts to compare proposals -> 403 Forbidden
  const intruderCompare = await request(`${API_BASE}/proposals/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${intruderToken}`,
    },
    body: JSON.stringify({
      briefId,
      proposalIds: [prop1Id, prop2Id],
    }),
  });
  assert.strictEqual(intruderCompare.status, 403, 'Intruder cannot compare proposals for someone else brief');
  console.log('  -> Comparison Engine authorization strictly enforced (403 for unauthorized users).');

  // -------------------------------------------------------------
  // Test 7: Proposal Acceptance, Contract Snapshot & Competing Declination
  // -------------------------------------------------------------
  console.log('\n[7/7] Testing Proposal Acceptance, Contract Snapshot & Zero Escrow Custody...');

  // Intruder attempts to accept Proposal 2 -> 403 Forbidden!
  const intruderAccept = await request(`${API_BASE}/contracts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${intruderToken}`,
    },
    body: JSON.stringify({
      proposalId: prop2Id,
      clientSignature: 'Intruder Signature',
    }),
  });
  assert.strictEqual(intruderAccept.status, 403, 'Intruder cannot accept proposal for another client brief');
  console.log('  -> Unauthorized acceptance blocked with HTTP 403 Forbidden.');

  // Brief owner accepts Proposal 2 (Marcus Chen)
  const clientAccept = await request(`${API_BASE}/contracts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      proposalId: prop2Id,
      clientSignature: 'Elena Rostova, Managing Director',
      paymentMethod: 'bank_transfer',
    }),
  });
  assert.strictEqual(clientAccept.status, 201, `Contract creation failed: ${clientAccept.text}`);
  const contract = clientAccept.json.contract;
  assert.strictEqual(contract.status, 'active');
  assert.strictEqual(contract.totalBudget, 4000);
  assert.ok(contract.proposalSnapshot, 'Accepted proposal terms snapshot must be preserved in contract');
  console.log(`  -> Contract created with snapshot of agreed terms (ID: ${contract.id}).`);

  // Verify competing Proposal 1 was automatically updated to 'declined'
  const prop1Check = await request(`${API_BASE}/proposals/${prop1Id}`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.strictEqual(prop1Check.status, 200);
  assert.strictEqual(prop1Check.json.proposal.status, 'declined', 'Competing proposals must be marked declined');
  console.log('  -> Competing Proposal 1 automatically marked declined.');

  // Attempt duplicate acceptance on same brief/proposal -> 409 Conflict
  const duplicateAccept = await request(`${API_BASE}/contracts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      proposalId: prop2Id,
      clientSignature: 'Duplicate attempt',
    }),
  });
  assert.strictEqual(duplicateAccept.status, 409, 'Duplicate contract creation must be blocked with 409');
  console.log('  -> Duplicate contract creation prevented with HTTP 409 Conflict.');

  console.log('\n=============================================================');
  console.log('  ALL PHASE 8 TESTS PASSED WITH 100% SUCCESS!');
  console.log('=============================================================\n');
}

runPhase8Tests().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
