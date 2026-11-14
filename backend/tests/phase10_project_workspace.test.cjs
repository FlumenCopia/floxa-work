/**
 * FLOXA WORK — Phase 10: Project Collaboration Workspace & Milestone Execution Test Suite
 *
 * Validates:
 * 1. Workspace retrieval & strict authorization barriers (unauthorized rejected with 403)
 * 2. Task Management lifecycle (create, assign, status transition, comments, cross-project protection)
 * 3. Milestone deliverable versioning (v1, v2...) & submission history preservation
 * 4. Revision request with client feedback & resubmission
 * 5. Deliverable approval recording correct actor & timestamp
 * 6. Non-custodial independence (deliverable approval does NOT change payment status)
 * 7. Resource-level private file authorization & download barriers
 * 8. Server-side WebSocket project room authorization (blocks non-participants)
 * 9. Persistent Notifications & read state transitions
 * 10. Dual-party project closeout confirmation & checklist
 */

const assert = require('assert');
const WebSocket = require('ws');

const API_BASE = 'http://localhost:5001/api';
const WS_URL = 'ws://localhost:5001/ws';

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

async function runPhase10Tests() {
  console.log('\n========================================================================');
  console.log('  FLOXA WORK — PHASE 10: COLLABORATION WORKSPACE & MILESTONE EXECUTION');
  console.log('========================================================================\n');

  const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  // 1. Entities
  const clientData = {
    email: `client_p10_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Sanjay Mehta',
    handle: `sanjay_p10_${unique}`,
    role: 'client',
  };

  const talentData = {
    email: `talent_p10_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Aravind V.',
    handle: `aravind_p10_${unique}`,
    role: 'freelancer',
  };

  const outsiderData = {
    email: `outsider_p10_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Outsider Member',
    handle: `outsider_p10_${unique}`,
    role: 'client',
  };

  console.log('[1/10] Registering Client, Freelancer, and Outsider...');
  const regClient = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData),
  });
  assert.strictEqual(regClient.status, 201);
  const clientToken = regClient.json.token;
  const clientId = regClient.json.user.id;

  const regTalent = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(talentData),
  });
  assert.strictEqual(regTalent.status, 201);
  const talentToken = regTalent.json.token;
  const talentId = regTalent.json.user.id;

  const regOutsider = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(outsiderData),
  });
  assert.strictEqual(regOutsider.status, 201);
  const outsiderToken = regOutsider.json.token;
  const outsiderId = regOutsider.json.user.id;
  console.log('✓ All 3 test actors registered.');

  // 2. Client Posts Brief, Talent Submits Proposal, Client Accepts -> Contract Created
  console.log('\n[2/10] Setting Up Active Project Contract via Proposal Acceptance...');
  const createBrief = await request(`${API_BASE}/briefs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      title: 'Design System Implementation Project',
      problemStatement: 'Need cohesive design system and React component library.',
      category: 'uiux',
      budgetMin: 3000,
      budgetMax: 5000,
      deliverablesRequired: ['Token foundation', 'Figma UI Library', 'Storybook components'],
    }),
  });
  assert.strictEqual(createBrief.status, 201);
  const briefId = createBrief.json.brief._id || createBrief.json.brief.id;

  const createProposal = await request(`${API_BASE}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({
      briefId,
      totalPrice: 4000,
      timelineWeeks: 4,
      category: 'uiux',
      problemDiagnosis: 'Identified component fragmentation across existing portals.',
      proposedSolution: 'Deliver unified token foundation followed by pixel-perfect React components.',
      relevantCaseStudies: 'Delivered MedTech design system.',
      proposedMilestones: [
        { milestoneNumber: 1, title: 'Tokens & Typography Foundation', description: 'Color, type, elevation tokens', amount: 1600 },
        { milestoneNumber: 2, title: 'Component Library in Figma', description: 'Core 40 components', amount: 1400 },
        { milestoneNumber: 3, title: 'React Storybook Handover', description: 'Component code and documentation', amount: 1000 },
      ],
    }),
  });
  assert.strictEqual(createProposal.status, 201, `Failed to submit proposal: ${createProposal.text}`);
  const proposalId = createProposal.json.proposal._id || createProposal.json.proposal.id;

  // Accept Proposal
  const acceptRes = await request(`${API_BASE}/contracts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      proposalId,
      clientSignature: 'Sanjay Mehta E-Sign',
      paymentMethod: 'bank_transfer',
    }),
  });
  assert.strictEqual(acceptRes.status, 201, `Failed to create contract: ${acceptRes.text}`);
  const contractId = acceptRes.json.contract._id || acceptRes.json.contract.id;
  const milestones = acceptRes.json.milestones;
  const milestone1Id = milestones[0]._id || milestones[0].id;
  const milestone2Id = milestones[1]._id || milestones[1].id;
  const milestone3Id = milestones[2]._id || milestones[2].id;
  console.log(`✓ Active contract established (ID: ${contractId}) with 3 milestones.`);

  // 3. Workspace Retrieval & Authorization Barriers
  console.log('\n[3/10] Verifying Project Workspace Retrieval & Authorization Isolation...');
  // A. Unauthorized outsider is rejected
  const outsiderWorkspace = await request(`${API_BASE}/contracts/${contractId}/workspace`, {
    headers: { Authorization: `Bearer ${outsiderToken}` },
  });
  assert.strictEqual(outsiderWorkspace.status, 403, 'Outsider must be rejected with 403 Forbidden');
  console.log('✓ Unauthorized workspace access blocked with HTTP 403 Forbidden.');

  // B. Client retrieves workspace
  const clientWorkspace = await request(`${API_BASE}/contracts/${contractId}/workspace`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.strictEqual(clientWorkspace.status, 200);
  assert.strictEqual(clientWorkspace.json.workspace.userRole, 'client');
  assert(clientWorkspace.json.workspace.authoritativeScope, 'Authoritative scope must be preserved from snapshot');
  console.log('✓ Client workspace retrieved with authoritative scope snapshot.');

  // C. Freelancer retrieves workspace
  const talentWorkspace = await request(`${API_BASE}/contracts/${contractId}/workspace`, {
    headers: { Authorization: `Bearer ${talentToken}` },
  });
  assert.strictEqual(talentWorkspace.status, 200);
  assert.strictEqual(talentWorkspace.json.workspace.userRole, 'freelancer');
  console.log('✓ Freelancer workspace retrieved with full milestone breakdown.');

  // 4. Task Management Lifecycle
  console.log('\n[4/10] Testing Task Management: Creation, Assignment, Cross-Project Isolation, Updates...');
  // A. Create Task
  const createTaskRes = await request(`${API_BASE}/contracts/${contractId}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      title: 'Review Brand Color Contrast Tokens',
      description: 'Audit tokens for WCAG AA compliance.',
      milestoneId: milestone1Id,
      assignedTo: talentId,
      priority: 'high',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });
  assert.strictEqual(createTaskRes.status, 201, `Failed to create task: ${createTaskRes.text}`);
  const taskId = createTaskRes.json.task._id || createTaskRes.json.task.id;
  assert.strictEqual(createTaskRes.json.task.status, 'todo');
  assert.strictEqual(createTaskRes.json.task.priority, 'high');
  console.log('✓ Project task created and assigned to freelancer.');

  // B. Cross-project task isolation: Outsider cannot modify or view task
  const outsiderTaskUpdate = await request(`${API_BASE}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${outsiderToken}`,
    },
    body: JSON.stringify({ status: 'completed' }),
  });
  assert.strictEqual(outsiderTaskUpdate.status, 403, 'Cross-project task update must return 403 Forbidden');
  console.log('✓ Cross-project task modification blocked with HTTP 403 Forbidden.');

  // C. Freelancer updates status: 'todo' -> 'in_progress' -> 'completed'
  const updateProgress = await request(`${API_BASE}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({ status: 'in_progress' }),
  });
  assert.strictEqual(updateProgress.status, 200);
  assert.strictEqual(updateProgress.json.task.status, 'in_progress');

  const updateComplete = await request(`${API_BASE}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({ status: 'completed' }),
  });
  assert.strictEqual(updateComplete.status, 200);
  assert.strictEqual(updateComplete.json.task.status, 'completed');
  assert(updateComplete.json.task.completedAt, 'completedAt timestamp must be recorded');
  console.log('✓ Task status lifecycle validated (todo -> in_progress -> completed).');

  // D. Invalid status transition rejection
  const invalidStatusUpdate = await request(`${API_BASE}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({ status: 'not_a_real_status' }),
  });
  assert.strictEqual(invalidStatusUpdate.status, 400, 'Invalid status must be rejected with 400 Bad Request');
  console.log('✓ Invalid task status correctly rejected.');

  // E. Add task comment
  const addComment = await request(`${API_BASE}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({ text: 'All contrast ratios exceed 4.5:1 ratio.' }),
  });
  assert.strictEqual(addComment.status, 201);
  assert.strictEqual(addComment.json.task.comments.length, 1);
  console.log('✓ Task comment added and persisted in MongoDB.');

  // 5. Deliverable Versioning, Revision Request & Resubmission
  console.log('\n[5/10] Testing Milestone Deliverable Versioning & Revision Requests...');
  // A. Freelancer submits Version 1 of Milestone 2
  const submitV1 = await request(`${API_BASE}/milestones/${milestone2Id}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({
      title: 'Figma Components v1 - Initial Draft',
      notes: 'Contains initial buttons, inputs, and modals.',
      fileUrls: ['Figma_Design_Tokens_v1.zip'],
    }),
  });
  assert.strictEqual(submitV1.status, 200, `Failed submit v1: ${submitV1.text}`);
  const m2AfterV1 = submitV1.json.milestone;
  assert.strictEqual(m2AfterV1.deliverableStatus, 'in_review');
  assert.strictEqual(m2AfterV1.submissions.length, 1);
  assert.strictEqual(m2AfterV1.submissions[0].version, 1);
  console.log('✓ Deliverable Version 1 submitted (status: in_review).');

  // B. Freelancer attempts to approve their own deliverable -> rejected
  const talentApproveSelf = await request(`${API_BASE}/milestones/${milestone2Id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${talentToken}` },
  });
  assert.strictEqual(talentApproveSelf.status, 403, 'Freelancer cannot approve their own deliverable');
  console.log('✓ Freelancer prevented from approving own deliverable (HTTP 403 Forbidden).');

  // C. Client requests revision with explanation
  const revisionReq = await request(`${API_BASE}/milestones/${milestone2Id}/revisions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      feedback: 'Please include disabled and hover states for all primary button variants.',
    }),
  });
  assert.strictEqual(revisionReq.status, 200, `Failed to request revision: ${revisionReq.text}`);
  const m2AfterRev = revisionReq.json.milestone;
  assert.strictEqual(m2AfterRev.deliverableStatus, 'revision_requested');
  assert.strictEqual(m2AfterRev.revisionRequests.length, 1);
  assert.strictEqual(m2AfterRev.submissions[0].reviewStatus, 'revision_requested');
  console.log('✓ Client revision requested with clear feedback recorded in history.');

  // D. Freelancer resubmits Version 2
  const submitV2 = await request(`${API_BASE}/milestones/${milestone2Id}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({
      title: 'Figma Components v2 - With Button States',
      notes: 'Added disabled, focus, and hover states as requested.',
      fileUrls: ['Figma_Design_Tokens_v2.zip'],
    }),
  });
  assert.strictEqual(submitV2.status, 200);
  const m2AfterV2 = submitV2.json.milestone;
  assert.strictEqual(m2AfterV2.deliverableStatus, 'in_review');
  assert.strictEqual(m2AfterV2.submissions.length, 2);
  assert.strictEqual(m2AfterV2.submissions[0].version, 1);
  assert.strictEqual(m2AfterV2.submissions[1].version, 2);
  console.log('✓ Version 2 resubmitted without overwriting Version 1 (versioning preserved).');

  // E. Client approves Milestone 2
  const approveM2 = await request(`${API_BASE}/milestones/${milestone2Id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.strictEqual(approveM2.status, 200);
  const m2Approved = approveM2.json.milestone;
  assert.strictEqual(m2Approved.deliverableStatus, 'approved');
  assert(m2Approved.approvedAt, 'approvedAt timestamp required');
  assert.strictEqual(m2Approved.approvedBy.toString(), clientId.toString());
  console.log('✓ Deliverable approved with actor ID and timestamp recorded.');

  // 6. Deliverable vs Payment Independence (Permanent Business Invariant)
  console.log('\n[6/10] Verifying Deliverable Approval DOES NOT Alter Payment Status (Non-Custodial Invariant)...');
  assert.strictEqual(
    m2Approved.paymentStatus,
    'not_recorded',
    'Deliverable approval must NEVER automatically mark payment as reported or acknowledged'
  );
  console.log('✓ Deliverable state and Payment state are strictly independent (0% platform custody).');

  // 7. Resource-Level Private File Security
  console.log('\n[7/10] Testing Resource-Level Private File Access Authorization...');
  // Outsider cannot download private deliverable file
  const unauthorizedDownload = await request(`${API_BASE}/files/Figma_Design_Tokens_v2.zip/download`, {
    headers: { Authorization: `Bearer ${outsiderToken}` },
  });
  assert([403, 404].includes(unauthorizedDownload.status), 'Outsider must be blocked from private file download');
  console.log('✓ Private deliverable file download forbidden for non-participants.');

  // 8. WebSocket Project-Room Server-Side Authorization
  console.log('\n[8/10] Testing WebSocket Server-Side Project Room Isolation...');
  const testWsIsolation = await new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    let joinedReceived = false;
    let errorReceived = false;

    ws.on('open', () => {
      // 1. Authenticate with outsider token
      ws.send(JSON.stringify({ type: 'auth', token: outsiderToken }));

      setTimeout(() => {
        // 2. Outsider tries to join project room of Sanjay and Aravind
        ws.send(JSON.stringify({ type: 'join_room', room: `contract:${contractId}` }));
      }, 300);
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'room_join_error') {
          errorReceived = true;
          ws.close();
          resolve(true);
        } else if (msg.type === 'room_joined' && msg.room === `contract:${contractId}`) {
          joinedReceived = true;
          ws.close();
          reject(new Error('Outsider was improperly permitted into private contract room!'));
        }
      } catch (err) {
        // ignore
      }
    });

    setTimeout(() => {
      if (!errorReceived) {
        ws.close();
        resolve(false);
      }
    }, 2500);
  });
  assert(testWsIsolation, 'WebSocket server must reject outsider from joining contract room');
  console.log('✓ WebSocket server-side room authorization successfully blocked outsider.');

  // 9. Persistent Notifications & Read Transitions
  console.log('\n[9/10] Testing Persistent Project Notifications & Read Transitions...');
  const notifsRes = await request(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${talentToken}` },
  });
  assert.strictEqual(notifsRes.status, 200);
  assert(Array.isArray(notifsRes.json.notifications));
  assert(notifsRes.json.notifications.length > 0, 'Expected notifications generated from project actions');

  const firstNotif = notifsRes.json.notifications[0];
  const markRead = await request(`${API_BASE}/notifications/${firstNotif._id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${talentToken}` },
  });
  assert.strictEqual(markRead.status, 200);
  assert.strictEqual(markRead.json.notification.read, true);
  console.log('✓ Notifications delivered and read state updated.');

  // 10. Project Closeout & Handover Dual-Confirmation
  console.log('\n[10/10] Testing Dual-Party Project Closeout & Handover Workflow...');
  // A. Approve Milestone 3 to make all milestones approved
  await request(`${API_BASE}/milestones/${milestone3Id}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({
      title: 'Storybook React Handover Bundle',
      fileUrls: ['React_Storybook_v1.zip'],
    }),
  });
  await request(`${API_BASE}/milestones/${milestone3Id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
  });

  // B. Client confirms closeout
  const clientCloseout = await request(`${API_BASE}/contracts/${contractId}/closeout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({ notes: 'All 3 milestone packages verified and accepted.' }),
  });
  assert.strictEqual(clientCloseout.status, 200);
  assert.strictEqual(clientCloseout.json.isFullyClosed, false, 'Requires both parties to confirm closeout');
  assert.strictEqual(clientCloseout.json.contract.clientCloseoutConfirmed, true);
  console.log('✓ Client closeout confirmed. Contract awaiting freelancer counterpart confirmation.');

  // C. Freelancer confirms closeout -> Project becomes fully completed
  const talentCloseout = await request(`${API_BASE}/contracts/${contractId}/closeout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({ notes: 'Handover complete and final repo access transferred.' }),
  });
  assert.strictEqual(talentCloseout.status, 200);
  assert.strictEqual(talentCloseout.json.isFullyClosed, true, 'Both parties confirmed; project is now closed');
  assert.strictEqual(talentCloseout.json.contract.status, 'completed');
  assert.strictEqual(talentCloseout.json.contract.closeoutStatus, 'completed');
  assert(talentCloseout.json.contract.actualCompletionDate, 'actualCompletionDate must be recorded');
  console.log('✓ Dual-party project closeout verified. Project marked completed.');

  console.log('\n========================================================================');
  console.log('  ALL PHASE 10 COLLABORATION WORKSPACE TESTS PASSED (100%)');
  console.log('========================================================================\n');
}

runPhase10Tests().catch((err) => {
  console.error('\n❌ PHASE 10 TEST RUN FAILED:', err);
  process.exit(1);
});
