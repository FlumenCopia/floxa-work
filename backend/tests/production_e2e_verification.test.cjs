const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5001';

async function runTests() {
  console.log('=== [FLOXA WORK PRODUCTION END-TO-END VERIFICATION] ===\n');

  // 1. Health & Security Headers
  console.log('1. Checking Health and Security Headers...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  assert.strictEqual(healthRes.status, 200);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'ok');

  // Verify Security Headers
  const xFrame = healthRes.headers.get('x-frame-options');
  const xContent = healthRes.headers.get('x-content-type-options');
  const hsts = healthRes.headers.get('strict-transport-security');
  assert.strictEqual(xFrame, 'SAMEORIGIN', 'Missing or invalid X-Frame-Options');
  assert.strictEqual(xContent, 'nosniff', 'Missing or invalid X-Content-Type-Options');
  assert.ok(hsts, 'Missing Strict-Transport-Security header');
  console.log('   ✓ Health check OK. Security headers verified (X-Frame-Options: SAMEORIGIN, X-Content-Type-Options: nosniff, HSTS).\n');

  // 2. Authentication: Client & Freelancer
  console.log('2. Authenticating Client & Freelancer...');
  const clientLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'client@floxa.work', password: 'Password123!' }),
  });
  assert.strictEqual(clientLogin.status, 200);
  const clientData = await clientLogin.json();
  const clientToken = clientData.token;
  assert.ok(clientToken, 'Client token missing');

  const freelancerLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'freelancer@floxa.work', password: 'Password123!' }),
  });
  assert.strictEqual(freelancerLogin.status, 200);
  const freelancerData = await freelancerLogin.json();
  const freelancerToken = freelancerData.token;
  assert.ok(freelancerToken, 'Freelancer token missing');
  console.log(`   ✓ Client logged in: ${clientData.user.name} (${clientData.user.email})`);
  console.log(`   ✓ Freelancer logged in: ${freelancerData.user.name} (${freelancerData.user.email})\n`);

  // 3. Client creates a Brief
  console.log('3. Client creating a Guided Discovery Brief...');
  const briefRes = await fetch(`${BASE_URL}/api/briefs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      title: `E2E Verified Brand Project ${Date.now()}`,
      category: 'branding',
      problemStatement: 'Client needs rigorous vector brand tokens and design system architecture.',
      deliverablesRequired: ['Vector Identity', 'Token Spec', 'Design Guidelines'],
      budgetMin: 2000,
      budgetMax: 3500,
      deadlineWeeks: 3,
    }),
  });
  assert.strictEqual(briefRes.status, 201);
  const briefJson = await briefRes.json();
  const createdBrief = briefJson.brief;
  assert.ok(createdBrief && createdBrief.id, 'Failed to create brief');
  console.log(`   ✓ Brief created in MongoDB: "${createdBrief.title}" (ID: ${createdBrief.id})\n`);

  // 4. Freelancer submits Mini-Discovery Proposal
  console.log('4. Freelancer submitting Mini-Discovery Pitch Proposal...');
  const propRes = await fetch(`${BASE_URL}/api/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${freelancerToken}`,
    },
    body: JSON.stringify({
      briefId: createdBrief.id,
      diagnosticAnswers: [
        {
          question: 'Problem Diagnosis',
          answer: 'Strict compliance required. Proposing 3-tier consumer token architecture.',
        },
      ],
      strategicSliders: [{ key: 'craft_direction', value: 85 }],
      proposedMilestones: [
        { title: 'Milestone 1: Discovery & Concept Exploration', amount: 960, deliveryDays: 7 },
        { title: 'Milestone 2: Production & Asset Engineering', amount: 960, deliveryDays: 7 },
        { title: 'Milestone 3: Final Delivery & Handover', amount: 480, deliveryDays: 7 },
      ],
      totalPrice: 2400,
      estimatedDays: 21,
    }),
  });
  const propJson = await propRes.json();
  assert.strictEqual(propRes.status, 201, `Proposal failed: ${JSON.stringify(propJson)}`);
  const proposalId = propJson.proposal.id;
  assert.ok(proposalId, 'Proposal ID missing');
  console.log(`   ✓ Mini-Discovery pitch proposal stored in MongoDB without validation errors (ID: ${proposalId})\n`);

  // 5. Client accepts proposal and pays 40% advance directly
  console.log('5. Client accepting proposal & executing Direct 40% Milestone Advance...');
  const contractRes = await fetch(`${BASE_URL}/api/contracts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      proposalId,
      clientSignature: 'Approved & Signed via Direct Milestone Billing',
    }),
  });
  assert.strictEqual(contractRes.status, 201);
  const contractJson = await contractRes.json();
  assert.ok(contractJson.contract, 'Contract missing');
  assert.strictEqual(contractJson.milestones.length, 3, 'Expected 3 milestones');
  const m1 = contractJson.milestones[0];
  const m2 = contractJson.milestones[1];
  assert.strictEqual(m1.escrowState || m1.status, 'released', 'Milestone 1 must be released (direct advance payment)');
  assert.strictEqual(m1.amount, 960, 'Milestone 1 amount must be 40% of 2400 = 960');
  console.log(`   ✓ Contract initialized! Milestone 1 ($960) advance disbursed directly. Zero custody escrow.\n`);

  // 6. Centralized File Upload (Multipart Form Data)
  console.log('6. Centralized File Management: Uploading test deliverable package...');
  const dummyFileContent = 'FLOXA WORK TEST VECTOR DELIVERABLE ASSETS - VERIFIED BUILD';
  const dummyFilePath = path.join(process.cwd(), 'temp_test_deliverable.zip');
  fs.writeFileSync(dummyFilePath, dummyFileContent);

  const formData = new FormData();
  const fileBlob = new Blob([fs.readFileSync(dummyFilePath)], { type: 'application/zip' });
  formData.append('file', fileBlob, 'Brand_Architecture_v1_Bundle.zip');
  formData.append('category', 'deliverable');

  const uploadRes = await fetch(`${BASE_URL}/api/files/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${freelancerToken}`,
    },
    body: formData,
  });
  const uploadJson = await uploadRes.json();
  assert.strictEqual(uploadRes.status, 201, `File upload failed: ${JSON.stringify(uploadJson)}`);
  const uploadedFile = uploadJson.file;
  assert.ok(uploadedFile && uploadedFile.id, 'Uploaded file record missing');
  console.log(`   ✓ File uploaded to disk storage & recorded in MongoDB: "${uploadedFile.originalName}" (${uploadedFile.sizeBytes} bytes, ID: ${uploadedFile.id})`);

  // Clean up temp file
  try { fs.unlinkSync(dummyFilePath); } catch {}

  // 7. Verify Secure File Download Stream (Owner access)
  console.log('7. Verifying Secure File Download Stream...');
  const downloadRes = await fetch(`${BASE_URL}/api/files/${uploadedFile.id}/download`, {
    headers: { Authorization: `Bearer ${freelancerToken}` },
  });
  assert.strictEqual(downloadRes.status, 200);
  const downloadedText = await downloadRes.text();
  assert.strictEqual(downloadedText, dummyFileContent);
  console.log('   ✓ File downloaded and streamed successfully with matching checksum.\n');

  // 8. Freelancer submits deliverable for Milestone 2
  console.log('8. Freelancer submitting deliverable for Milestone 2...');
  const delivRes = await fetch(`${BASE_URL}/api/milestones/${m2._id || m2.id}/deliverable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${freelancerToken}`,
    },
    body: JSON.stringify({
      fileUrls: [uploadedFile.downloadUrl],
      notes: 'Vector tokens and brand architecture assets submitted for client inspection.',
    }),
  });
  assert.strictEqual(delivRes.status, 200);
  const delivJson = await delivRes.json();
  assert.strictEqual(delivJson.milestone.escrowState || delivJson.milestone.status, 'in_review');
  console.log('   ✓ Milestone 2 moved to "in_review" window.\n');

  // 9. Client approves Milestone 2 deliverable
  console.log('9. Client approving Milestone 2 deliverable...');
  const approveRes = await fetch(`${BASE_URL}/api/milestones/${m2._id || m2.id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
  });
  assert.strictEqual(approveRes.status, 200);
  const approveJson = await approveRes.json();
  assert.strictEqual(approveJson.milestone.deliverableStatus || approveJson.milestone.status, 'approved');
  console.log(`   ✓ Milestone 2 deliverable approved! (Deliverable status: approved, Zero platform custody)\n`);

  // 10. Client reports direct payment outside the platform
  console.log('10. Client recording external direct payment details...');
  const reportPaymentRes = await fetch(`${BASE_URL}/api/milestones/${m2._id || m2.id}/payment/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      paymentMethod: 'bank_transfer',
      paymentMethodDetails: 'HDFC Direct Wire Transfer',
      externalReference: 'UTR-20261114-9842187',
      receiptFileUrl: uploadedFile.downloadUrl,
      notes: 'Direct bank transfer initiated for Milestone 2.',
    }),
  });
  assert.strictEqual(reportPaymentRes.status, 201);
  const reportPaymentJson = await reportPaymentRes.json();
  assert.strictEqual(reportPaymentJson.milestone.paymentStatus, 'reported_by_client');
  assert.ok(reportPaymentJson.paymentRecord.id);
  console.log(`   ✓ Direct payment reported in MongoDB by client (UTR: ${reportPaymentJson.paymentRecord.externalReference})\n`);

  // 11. Freelancer acknowledges receiving direct payment
  console.log('11. Freelancer acknowledging direct payment receipt in external account...');
  const ackRes = await fetch(`${BASE_URL}/api/milestones/${m2._id || m2.id}/payment/acknowledge`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${freelancerToken}`,
    },
  });
  assert.strictEqual(ackRes.status, 200);
  const ackJson = await ackRes.json();
  assert.strictEqual(ackJson.milestone.paymentStatus, 'acknowledged_by_freelancer');
  console.log('   ✓ Direct payment acknowledged and confirmed by talent.\n');

  // 12. Admin Operations & Platform Analytics Verification
  console.log('12. Verifying Admin Portal & Platform Analytics...');
  // 12a. Verify client cannot access admin stats (strict role governance)
  const clientForbiddenRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.strictEqual(clientForbiddenRes.status, 403, 'Ordinary client must be blocked from admin stats');

  // 12b. Authenticate/Register authorized admin
  const adminEmail = `e2e_admin_${Date.now()}@floxa.work`;
  const adminReg = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: adminEmail,
      password: 'Password123!',
      name: 'E2E Super Admin',
      handle: `admin_${Date.now()}`,
      role: 'admin',
      adminRole: 'super_admin',
    }),
  });
  const adminRegJson = await adminReg.json();
  const adminToken = adminRegJson.token;

  const adminStatsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(adminStatsRes.status, 200);
  const adminStatsJson = await adminStatsRes.json();
  assert.ok(adminStatsJson.metrics.users.totalUsers > 0);
  assert.ok(adminStatsJson.metrics.contracts.totalContracts > 0);
  const totalVal = adminStatsJson.metrics.contracts.contractualProjectMetrics.totalContractualAgreedValue;
  console.log(`   ✓ Admin statistics verified: Total Contracts: ${adminStatsJson.metrics.contracts.totalContracts}, Contractual Value: $${totalVal.toLocaleString()}.\n`);

  // 13. Profile Update Verification
  console.log('13. Verifying Profile Update & Persistence...');
  const profileUpdateRes = await fetch(`${BASE_URL}/api/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${freelancerToken}`,
    },
    body: JSON.stringify({
      headline: 'Principal Design Technologist & Systems Lead',
      hourlyRate: 110,
    }),
  });
  assert.strictEqual(profileUpdateRes.status, 200);
  const profileJson = await profileUpdateRes.json();
  assert.strictEqual(profileJson.profile.headline, 'Principal Design Technologist & Systems Lead');
  assert.strictEqual(profileJson.profile.hourlyRate, 110);
  console.log('   ✓ Profile persisted with new headline and $110/hr rate.\n');

  console.log('================================================================');
  console.log('>>> ALL 11 PRODUCTION VERIFICATION WORKFLOWS PASSED WITH 100% SUCCESS <<<');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('\n❌ TEST VERIFICATION FAILED:', err);
  process.exit(1);
});
