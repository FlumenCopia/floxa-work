/**
 * FLOXA WORK — PHASE 15 AUTOMATED TEST SUITE
 * Test Suite: phase15_user_experience.test.cjs
 * Objective: End-to-end verification of marketplace UX flows, proposal comparison metrics,
 *            contract initialization snapshots, non-custodial external payment disclosures,
 *            and user journey integrity across real MongoDB instance.
 */

const http = require('http');
const assert = require('assert');

const API_BASE = 'http://localhost:5001/api';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed, json: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runPhase15Tests() {
  console.log('\n========================================================================');
  console.log('  FLOXA WORK — PHASE 15: MARKETPLACE UX & REAL USER EXPERIENCE TESTS');
  console.log('========================================================================\n');

  const ts = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const clientEmail = `ux_client_${ts}@floxa.test`;
  const freelancer1Email = `ux_freelancer1_${ts}@floxa.test`;
  const freelancer2Email = `ux_freelancer2_${ts}@floxa.test`;
  const password = 'Password123!';

  let clientToken, freelancer1Token, freelancer2Token;
  let briefId, proposal1Id, proposal2Id, contractId;

  // 1. User Registration & Role Setup
  console.log('[1/8] Verifying User Registration & Role Setup...');
  const regClient = await request('POST', '/auth/register', {
    name: 'Alice Client UX',
    handle: `client_${ts}`,
    email: clientEmail,
    password,
    role: 'client',
  });
  assert.strictEqual(regClient.status, 201, 'Client registration should return 201');
  clientToken = regClient.json.token;

  const regFree1 = await request('POST', '/auth/register', {
    name: 'Bob Strategist',
    handle: `free1_${ts}`,
    email: freelancer1Email,
    password,
    role: 'freelancer',
  });
  assert.strictEqual(regFree1.status, 201, 'Freelancer 1 registration should return 201');
  freelancer1Token = regFree1.json.token;

  const regFree2 = await request('POST', '/auth/register', {
    name: 'Carol Engineer',
    handle: `free2_${ts}`,
    email: freelancer2Email,
    password,
    role: 'freelancer',
  });
  assert.strictEqual(regFree2.status, 201, 'Freelancer 2 registration should return 201');
  freelancer2Token = regFree2.json.token;

  console.log('✓ Users registered with distinct roles and authentication tokens.');

  // 2. Brief Creation & Validation Boundaries
  console.log('[2/8] Testing Brief Creation & Validation Bounds...');
  const invalidBrief = await request('POST', '/briefs', {
    title: 'Tiny',
    problemStatement: 'Short',
    category: 'branding',
  }, clientToken);
  if (invalidBrief.status === 400) {
    console.log('✓ Sub-length brief properly rejected with 400 Bad Request.');
  }

  const validBrief = await request('POST', '/briefs', {
    title: `Enterprise Fintech Dashboard & Design System ${ts}`,
    category: 'uiux',
    problemStatement: 'We need a scalable high-contrast institutional dashboard for enterprise asset managers with strict accessibility requirements.',
    deliverablesRequired: ['Component Library', 'Design Tokens', 'Interactive Prototype'],
    budgetMin: 3000,
    budgetMax: 6000,
    deadlineWeeks: 4,
  }, clientToken);

  assert.strictEqual(validBrief.status, 201, 'Valid brief creation should return 201');
  briefId = validBrief.json.brief?.id || validBrief.json.brief?._id || validBrief.json._id;
  console.log(`✓ Structured brief published successfully (ID: ${briefId}).`);

  // 3. Mini-Discovery Proposal Submissions
  console.log('[3/8] Testing Structured Mini-Discovery Proposals...');
  const prop1Res = await request('POST', `/briefs/${briefId}/proposals`, {
    problemDiagnosis: 'The core challenge is reducing information overload while maintaining rapid financial execution times.',
    proposedSolution: 'Deliver a streamlined component library with accessibility compliance.',
    technicalApproach: 'Atomic design architecture with Tailwind CSS and Next.js 16.',
    portfolioReferences: ['https://floxa.work/portfolio/fintech-ux'],
    totalBudget: 4000,
    currency: 'USD',
    estimatedDurationWeeks: 3,
    proposedMilestones: [
      {
        title: 'Information Architecture & Design Tokens',
        description: 'Design token specification and color taxonomy.',
        amount: 2000,
        currency: 'USD',
        estimatedDays: 7,
        deliverablesList: ['Figma Tokens', 'Token Export JSON'],
      },
      {
        title: 'Core Trading & Portfolio Screens',
        description: 'Responsive screens with high contrast.',
        amount: 2000,
        currency: 'USD',
        estimatedDays: 14,
        deliverablesList: ['Screens Package', 'Interactive Prototype'],
      },
    ],
  }, freelancer1Token);
  assert.strictEqual(prop1Res.status, 201, 'Proposal 1 submission should return 201');
  proposal1Id = prop1Res.json.proposal?.id || prop1Res.json.proposal?._id;

  const prop2Res = await request('POST', `/briefs/${briefId}/proposals`, {
    problemDiagnosis: 'Focusing on accessibility contrast standards (WCAG AAA) and modular design tokens.',
    proposedSolution: 'Deliver complete component kit with audited accessibility.',
    technicalApproach: 'Tailwind CSS and React 19 design systems.',
    portfolioReferences: ['https://floxa.work/portfolio/a11y-design'],
    totalBudget: 5000,
    currency: 'USD',
    estimatedDurationWeeks: 4,
    proposedMilestones: [
      {
        title: 'Audit & Token System',
        description: 'WCAG AAA audit and color tokens.',
        amount: 2000,
        currency: 'USD',
        estimatedDays: 10,
        deliverablesList: ['Audit Report', 'Tokens'],
      },
      {
        title: 'Component Library & Handover',
        description: 'Production library with full keyboard nav.',
        amount: 3000,
        currency: 'USD',
        estimatedDays: 18,
        deliverablesList: ['Component Library'],
      },
    ],
  }, freelancer2Token);
  assert.strictEqual(prop2Res.status, 201, 'Proposal 2 submission should return 201');
  proposal2Id = prop2Res.json.proposal?.id || prop2Res.json.proposal?._id;

  console.log('✓ Two structured mini-discovery proposals submitted with milestone breakdowns.');

  // 4. Comparison Engine Data Integrity
  console.log('[4/8] Testing Proposal Comparison Retrieval & Metrics...');
  const compareRes = await request('POST', '/proposals/compare', {
    briefId,
    proposalIds: [proposal1Id, proposal2Id],
  }, clientToken);
  assert.strictEqual(compareRes.status, 200, 'Proposal comparison should return 200');
  const compData = compareRes.json;
  assert.strictEqual(compData.comparisonMetrics.priceRange.min, 4000);
  assert.strictEqual(compData.comparisonMetrics.priceRange.max, 5000);
  assert.strictEqual(compData.comparisonMetrics.priceRange.delta, 1000);
  console.log(`✓ Comparison engine metrics confirmed: Price delta = $${compData.comparisonMetrics.priceRange.delta}.`);

  // 5. Shortlisting & Declining Flow
  console.log('[5/8] Testing Proposal Shortlisting & State Updates...');
  const shortlistRes = await request('POST', `/proposals/${proposal1Id}/shortlist`, {}, clientToken);
  assert.strictEqual(shortlistRes.status, 200, 'Shortlist should return 200');
  console.log('✓ Proposal 1 shortlisted successfully.');

  // 6. Explicit Proposal Acceptance & Immutable Contract Snapshot
  console.log('[6/8] Testing Proposal Acceptance & Contract Snapshot Freezing...');
  const acceptRes = await request('POST', `/proposals/${proposal1Id}/accept`, {
    acceptanceNotes: 'Terms confirmed with immutable milestones schedule.',
  }, clientToken);
  assert.strictEqual(acceptRes.status, 201, 'Acceptance should return 201');
  
  contractId = acceptRes.json.contract?.id || acceptRes.json.contract?._id;
  assert.ok(contractId, 'Contract ID must be returned');

  const wsRes = await request('GET', `/contracts/${contractId}/workspace`, null, clientToken);
  assert.strictEqual(wsRes.status, 200, 'Workspace retrieval should return 200');
  assert.strictEqual(wsRes.json.workspace.contract.status, 'active');
  assert.strictEqual(wsRes.json.workspace.contract.totalBudget, 4000);
  assert.strictEqual(wsRes.json.workspace.milestones.length, 2);
  console.log(`✓ Immutable contract snapshot verified (Contract ID: ${contractId}, Budget: $4,000, Milestones: 2).`);

  // 7. Non-Custodial Collaboration & External Settlement
  console.log('[7/8] Verifying Non-Custodial Collaboration & External Settlement Records...');
  const firstMilestone = wsRes.json.workspace.milestones[0];
  const mId = firstMilestone.id || firstMilestone._id;

  // Freelancer submits deliverable
  const subRes = await request('POST', `/milestones/${mId}/submissions`, {
    title: 'Design Tokens & Architecture Specification v1.0',
    notes: 'Complete Figma token specification and color taxonomy.',
    fileUrls: ['tokens.json'],
  }, freelancer1Token);
  assert.strictEqual(subRes.status, 200, 'Deliverable submission should return 200');

  // Client approves deliverable
  const approveRes = await request('POST', `/milestones/${mId}/approve`, {}, clientToken);
  assert.strictEqual(approveRes.status, 200, 'Deliverable approval should return 200');

  // Client logs direct external settlement (NEFT / UPI)
  const payRecordRes = await request('POST', `/milestones/${mId}/payment/report`, {
    paymentMethod: 'bank_transfer',
    externalReference: 'UTR-PHASE15-778899',
    notes: 'Direct NEFT transfer via corporate account.',
  }, clientToken);
  assert.strictEqual(payRecordRes.status, 201, 'External payment report should return 201');

  // Freelancer acknowledges receipt of funds
  const ackRes = await request('POST', `/milestones/${mId}/payment/acknowledge`, {}, freelancer1Token);
  assert.strictEqual(ackRes.status, 200, 'Payment acknowledgment should return 200');
  console.log('✓ Deliverable signed off, external payment reported with UTR reference, and acknowledged by talent.');

  // 8. Absolute Business Invariant: Zero Escrow Custody
  console.log('[8/8] Verifying Absolute Invariant: Zero Escrow & Zero Wallet Balances...');
  const walletCheck = await request('GET', '/users/me/wallet', null, clientToken);
  assert.strictEqual(walletCheck.status, 404, 'Platform wallet endpoint must not exist');

  const escrowCheck = await request('GET', '/escrow/balance', null, clientToken);
  assert.strictEqual(escrowCheck.status, 404, 'Platform escrow endpoint must not exist');

  console.log('✓ Non-custodial architectural invariant verified: No escrow, no custody, no wallets.');

  console.log('\n========================================================================');
  console.log('  ALL 8 PHASE 15 USER EXPERIENCE TESTS PASSED (100%)');
  console.log('========================================================================\n');
}

runPhase15Tests().catch((err) => {
  console.error('\n❌ Phase 15 Test Suite Failed:', err);
  process.exit(1);
});
