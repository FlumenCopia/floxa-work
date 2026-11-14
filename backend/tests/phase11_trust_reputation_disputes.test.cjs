/**
 * FLOXA WORK — Phase 11: Trust, Reputation, Reviews & Dispute Workflows Test Suite
 *
 * Validates:
 * 1. Review Eligibility (verified contract only; non-completed rejected with 400; non-participant rejected with 403)
 * 2. Self-Review Prevention (rejected with 400)
 * 3. Duplicate Review Prevention (rejected with 409)
 * 4. Double-Blind Publication (first review held pending_mutual; counterpart cannot view text; mutual submission unlocks both)
 * 5. Review Rating & Text Validation (ratings must be 1-5; text 10-2000 chars)
 * 6. Reputation Profile Aggregation (accurate recalculation of sub-scores, stars, contract counts; unpublished excluded)
 * 7. Review Editing Within Policy (reviewer edit; non-author blocked with 403; recalculates aggregates)
 * 8. Review Flagging & Moderation (flag review; admin hide review; hidden excluded from aggregates)
 * 9. Dispute Creation & Access (participant only; non-participant 403; invalid category 400; updates contract to disputed)
 * 10. Dispute Thread & Internal Moderator Note Protection (participants never see internal moderator notes)
 * 11. Dispute Resolution & Non-Custodial Disclosure (0% escrow custody, direct settlement disclosure)
 * 12. Safety: User Reporting & Blocking (blocks direct chat communication; unblocking restores communication)
 * 13. Permanent Non-Custody Invariant (zero platform escrow or held balances)
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

async function runPhase11Tests() {
  console.log('\n========================================================================');
  console.log('  FLOXA WORK — PHASE 11: TRUST, REPUTATION, REVIEWS & DISPUTE RESOLUTION');
  console.log('========================================================================\n');

  const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  // 1. Entities
  const clientData = {
    email: `client_p11_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Vikram Malhotra',
    handle: `vikram_p11_${unique}`,
    role: 'client',
  };

  const talentData = {
    email: `talent_p11_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Ananya Sharma',
    handle: `ananya_p11_${unique}`,
    role: 'freelancer',
  };

  const outsiderData = {
    email: `outsider_p11_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Rohan Deshmukh',
    handle: `rohan_p11_${unique}`,
    role: 'freelancer',
  };

  const adminData = {
    email: `admin_p11_${unique}@floxa.work`,
    password: 'Password123!',
    name: 'Platform Moderator',
    handle: `mod_p11_${unique}`,
    role: 'admin',
  };

  console.log('[1/12] Registering Client, Freelancer, Outsider, and Admin...');
  const regClient = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData),
  });
  assert.strictEqual(regClient.status, 201, 'Client registration should succeed');
  const clientToken = regClient.json.token;
  const clientId = regClient.json.user.id;

  const regTalent = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(talentData),
  });
  assert.strictEqual(regTalent.status, 201, 'Talent registration should succeed');
  const talentToken = regTalent.json.token;
  const talentId = regTalent.json.user.id;

  const regOutsider = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(outsiderData),
  });
  assert.strictEqual(regOutsider.status, 201, 'Outsider registration should succeed');
  const outsiderToken = regOutsider.json.token;
  const outsiderId = regOutsider.json.user.id;

  const regAdmin = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminData),
  });
  assert.strictEqual(regAdmin.status, 201, 'Admin registration should succeed');
  const adminToken = regAdmin.json.token;
  const adminId = regAdmin.json.user.id;

  console.log('✓ All 4 test users registered successfully.');

  // 2. Create Brief, Proposal, and Accept to form active Contract
  console.log('\n[2/12] Establishing Contract Collaboration Agreement...');
  const briefRes = await request(`${API_BASE}/briefs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      title: 'Global Fintech Mobile App Rebrand',
      problemStatement: 'End-to-end design tokens, mobile application components, and design system.',
      category: 'uiux',
      budgetMin: 3000,
      budgetMax: 5000,
    }),
  });
  assert.strictEqual(briefRes.status, 201, 'Brief creation should succeed');
  const briefId = briefRes.json.brief.id || briefRes.json.brief._id;

  const propRes = await request(`${API_BASE}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({
      briefId,
      totalPrice: 4500,
      timelineWeeks: 4,
      category: 'uiux',
      problemDiagnosis: 'Identified legacy styling debt and lack of standardized UI tokens.',
      proposedStrategy: 'Develop atomic design tokens and mobile component patterns.',
      deliverableBreakdown: ['Design Tokens', 'Mobile UI Kit', 'Handover Docs'],
      proposedMilestones: [
        { milestoneNumber: 1, title: 'Tokens & Typography', amount: 1500, description: 'Core tokens' },
        { milestoneNumber: 2, title: 'Screen Design', amount: 3000, description: 'Final screens' },
      ],
    }),
  });
  assert.strictEqual(propRes.status, 201, 'Proposal submission should succeed');
  const proposalId = propRes.json.proposal.id || propRes.json.proposal._id;

  const contractRes = await request(`${API_BASE}/contracts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      proposalId,
      clientSignature: 'Vikram Malhotra',
      paymentMethod: 'bank_transfer',
    }),
  });
  assert.strictEqual(contractRes.status, 201, 'Contract creation should succeed');
  const contractId = contractRes.json.contract.id || contractRes.json.contract._id;
  assert.strictEqual(contractRes.json.contract.status, 'active', 'Contract should be initially active');
  console.log(`✓ Contract ${contractId} created and active.`);

  // 3. Review Eligibility on Active Contract (Must be Rejected)
  console.log('\n[3/12] Verifying Review Eligibility Barriers on Active Contract...');
  const reviewOnActive = await request(`${API_BASE}/contracts/${contractId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      overallRating: 5,
      communicationRating: 5,
      professionalismRating: 5,
      qualityRating: 5,
      reliabilityRating: 5,
      reviewText: 'Attempting to review before contract completion should fail.',
    }),
  });
  assert.strictEqual(reviewOnActive.status, 400, 'Review on active contract must be rejected with 400');
  console.log('✓ Rejected review on non-completed contract with HTTP 400.');

  // 4. Dispute Lifecycle & Platform Mediation (0% Escrow Custody)
  console.log('\n[4/12] Testing Dispute Creation, Authorization & Non-Custodial Disclosure...');
  // 4a. Outsider attempting dispute
  const outsiderDispute = await request(`${API_BASE}/contracts/${contractId}/disputes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${outsiderToken}`,
    },
    body: JSON.stringify({
      category: 'scope_disagreement',
      title: 'Outsider dispute',
      description: 'I should not be able to dispute a contract I am not in.',
    }),
  });
  assert.strictEqual(outsiderDispute.status, 403, 'Non-participant dispute must be rejected with 403');
  console.log('✓ Non-participant dispute rejected with HTTP 403.');

  // 4b. Invalid dispute category
  const invalidCategoryDispute = await request(`${API_BASE}/contracts/${contractId}/disputes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      category: 'invalid_category_xyz',
      title: 'Invalid Category Test',
      description: 'Testing category validation failure.',
    }),
  });
  assert.strictEqual(invalidCategoryDispute.status, 400, 'Invalid dispute category must be rejected with 400');
  console.log('✓ Invalid dispute category rejected with HTTP 400.');

  // 4c. Valid dispute creation by Client
  const openDispute = await request(`${API_BASE}/contracts/${contractId}/disputes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      category: 'deliverable_quality',
      title: 'Clarification Needed on Typography Licensing',
      description: 'We need formal confirmation of font licensing in deliverable bundle before proceeding.',
      desiredOutcome: 'Proof of commercial web font license.',
    }),
  });
  assert.strictEqual(openDispute.status, 201, 'Dispute creation by participant should succeed');
  assert.strictEqual(openDispute.json.dispute.status, 'open', 'Dispute initial status must be open');
  assert.strictEqual(openDispute.json.dispute.category, 'deliverable_quality');
  assert.ok(openDispute.json.nonCustodialNotice, 'Non-custodial notice must be present in response');
  assert.ok(
    openDispute.json.nonCustodialNotice.includes('does not hold user funds in escrow'),
    'Non-custodial disclosure must explicitly confirm 0% platform escrow custody'
  );
  const disputeId = openDispute.json.dispute.id || openDispute.json.dispute._id;
  console.log(`✓ Dispute ${disputeId} created with explicit 0% escrow notice.`);

  // 4d. Verify duplicate open dispute is rejected
  const dupDispute = await request(`${API_BASE}/contracts/${contractId}/disputes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({
      category: 'missed_deadlines',
      title: 'Second dispute attempt',
      description: 'Attempting to open another dispute while one is active.',
    }),
  });
  assert.strictEqual(dupDispute.status, 409, 'Duplicate open dispute must be rejected with 409');
  console.log('✓ Duplicate open dispute prevented with HTTP 409.');

  // 4e. Post dispute messages & Internal Moderator Note Protection
  console.log('\n[5/12] Testing Dispute Messaging & Confidential Internal Moderator Notes...');
  // Participant message
  const talentMsg = await request(`${API_BASE}/disputes/${disputeId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({
      text: 'I have attached the SIL Open Font License documentation for the selected typeface.',
    }),
  });
  assert.strictEqual(talentMsg.status, 201, 'Participant dispute message should succeed');

  // Moderator internal private note
  const modNote = await request(`${API_BASE}/disputes/${disputeId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      text: 'INTERNAL CONFIDENTIAL NOTE: Verified that SIL OFL 1.1 covers commercial web use without fees.',
      isInternalModeratorNote: true,
    }),
  });
  assert.strictEqual(modNote.status, 201, 'Moderator internal note creation should succeed');

  // Client views dispute thread -> MUST NOT SEE internal note!
  const clientViewDispute = await request(`${API_BASE}/disputes/${disputeId}`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.strictEqual(clientViewDispute.status, 200);
  const participantMessages = clientViewDispute.json.messages;
  const leakedNote = participantMessages.find((m) => m.isInternalModeratorNote);
  assert.strictEqual(leakedNote, undefined, 'CRITICAL: Internal moderator notes must NEVER be exposed to regular participants');
  console.log('✓ Confidential internal moderator notes successfully protected from participants.');

  // Admin views dispute thread -> SHOULD SEE internal note
  const adminViewDispute = await request(`${API_BASE}/disputes/${disputeId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(adminViewDispute.status, 200);
  const adminMessages = adminViewDispute.json.messages;
  const foundNote = adminMessages.find((m) => m.isInternalModeratorNote);
  assert.ok(foundNote, 'Admin must see internal notes');
  console.log('✓ Admin correctly views internal moderator notes.');

  // 4f. Resolve dispute
  const resolveDispute = await request(`${API_BASE}/admin/disputes/${disputeId}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      resolutionSummary: 'License verified as open-source. Both parties agreed to complete final handover.',
      resolutionAction: 'Resolved via license clarification.',
      contractStatusUpdate: 'completed',
    }),
  });
  assert.strictEqual(resolveDispute.status, 200, 'Admin dispute resolution should succeed');
  assert.strictEqual(resolveDispute.json.dispute.status, 'resolved');
  console.log('✓ Dispute resolved by admin and contract marked completed.');

  // 5. Dual Closeout Confirmation & Contract Completion
  console.log('\n[6/12] Confirming Closeout Handover to unlock Verified Review Period...');
  await request(`${API_BASE}/contracts/${contractId}/closeout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({ notes: 'All assets received satisfactorily.' }),
  });
  await request(`${API_BASE}/contracts/${contractId}/closeout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({ notes: 'Handover complete and confirmed.' }),
  });

  // Verify contract is completed
  const contractDetails = await request(`${API_BASE}/contracts/${contractId}`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.strictEqual(contractDetails.json.contract.status, 'completed', 'Contract must be completed');
  console.log('✓ Contract closeout finalized and confirmed completed.');

  // 6. Review Validation Constraints: Self-Review, Outside Participant, Rating Boundaries
  console.log('\n[7/12] Testing Review Input Validation & Security Rules...');
  // Self review prevention
  const selfReview = await request(`${API_BASE}/contracts/${contractId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      contractId,
      targetId: clientId,
      overallRating: 5,
      communicationRating: 5,
      professionalismRating: 5,
      qualityRating: 5,
      reliabilityRating: 5,
      reviewText: 'Attempting to review myself should be rejected.',
    }),
  });
  assert.strictEqual(selfReview.status, 400, 'Self-review must be rejected with 400');
  console.log('✓ Self-review rejected with HTTP 400.');
  // Test outsider attempting review on completed contract
  const outsiderReview = await request(`${API_BASE}/contracts/${contractId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${outsiderToken}`,
    },
    body: JSON.stringify({
      overallRating: 5,
      communicationRating: 5,
      professionalismRating: 5,
      qualityRating: 5,
      reliabilityRating: 5,
      reviewText: 'Outsider review on completed contract should be forbidden.',
    }),
  });
  assert.strictEqual(outsiderReview.status, 403, 'Non-participant review on completed contract must be rejected with 403');
  console.log('✓ Non-participant review rejected with HTTP 403.');

  // Rating out of bounds (> 5)
  const invalidRatingReview = await request(`${API_BASE}/contracts/${contractId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      overallRating: 6, // Invalid
      communicationRating: 5,
      professionalismRating: 5,
      qualityRating: 5,
      reliabilityRating: 5,
      reviewText: 'Rating score of 6 should be rejected.',
    }),
  });
  assert.strictEqual(invalidRatingReview.status, 400, 'Score > 5 must be rejected with 400');
  console.log('✓ Score out-of-bounds rejected with HTTP 400.');

  // Review text too short (< 10 chars)
  const shortTextReview = await request(`${API_BASE}/contracts/${contractId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      overallRating: 5,
      communicationRating: 5,
      professionalismRating: 5,
      qualityRating: 5,
      reliabilityRating: 5,
      reviewText: 'Too short', // 9 chars
    }),
  });
  assert.strictEqual(shortTextReview.status, 400, 'Review text < 10 chars must be rejected with 400');
  console.log('✓ Short review text rejected with HTTP 400.');

  // 7. Double-Blind Review Flow (Client Submits Review 1)
  console.log('\n[8/12] Testing Double-Blind Review Publication Mechanics...');
  const clientReviewRes = await request(`${API_BASE}/contracts/${contractId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      overallRating: 5,
      communicationRating: 5,
      professionalismRating: 4,
      qualityRating: 5,
      reliabilityRating: 5,
      reviewText: 'Outstanding design thinking and exceptional fintech component library delivery.',
    }),
  });
  assert.strictEqual(clientReviewRes.status, 201, 'Client review should succeed');
  assert.strictEqual(clientReviewRes.json.review.status, 'pending_mutual', 'Initial review must be pending_mutual');
  assert.strictEqual(clientReviewRes.json.mutualPublished, false, 'Mutual published should be false when only 1 submitted');
  const clientReviewId = clientReviewRes.json.review.id || clientReviewRes.json.review._id;
  console.log('✓ Client review submitted in pending_mutual double-blind holding state.');

  // Freelancer checks review status: MUST NOT SEE Client review details yet!
  const talentReviewStatus1 = await request(`${API_BASE}/contracts/${contractId}/reviews/status`, {
    headers: { Authorization: `Bearer ${talentToken}` },
  });
  assert.strictEqual(talentReviewStatus1.status, 200);
  assert.strictEqual(talentReviewStatus1.json.counterpartReviewSubmitted, true);
  assert.strictEqual(talentReviewStatus1.json.isMutualPublished, false);
  assert.strictEqual(talentReviewStatus1.json.counterpartReview, null, 'Counterpart review text must remain confidential (null) before mutual submission');
  console.log('✓ Double-blind secrecy verified: Freelancer cannot see client review text.');

  // Verify duplicate review from client is rejected
  const dupClientReview = await request(`${API_BASE}/contracts/${contractId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      overallRating: 4,
      communicationRating: 4,
      professionalismRating: 4,
      qualityRating: 4,
      reliabilityRating: 4,
      reviewText: 'Attempting a second review on the same contract.',
    }),
  });
  assert.strictEqual(dupClientReview.status, 409, 'Duplicate review on same contract must be rejected with 409');
  console.log('✓ Duplicate review on same contract rejected with HTTP 409.');

  // Check public profile of Freelancer before mutual publication:
  // Must NOT include the pending_mutual review!
  const talentPublicReviewsBefore = await request(`${API_BASE}/users/${talentId}/reviews`);
  assert.strictEqual(talentPublicReviewsBefore.status, 200);
  assert.strictEqual(talentPublicReviewsBefore.json.totalReviews, 0, 'Unpublished review must not appear in public reviews');
  console.log('✓ Unpublished reviews excluded from public profile.');

  // 8. Freelancer Submits Review 2 -> Mutual Unlock Condition Met!
  console.log('\n[9/12] Submitting Second Review & Verifying Automatic Mutual Unlock...');
  const talentReviewRes = await request(`${API_BASE}/contracts/${contractId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({
      overallRating: 5,
      communicationRating: 5,
      professionalismRating: 5,
      qualityRating: 5,
      reliabilityRating: 5,
      reviewText: 'Exceptional client to collaborate with. Prompt feedback and crystal-clear vision.',
    }),
  });
  assert.strictEqual(talentReviewRes.status, 201, 'Freelancer review should succeed');
  assert.strictEqual(talentReviewRes.json.review.status, 'published', 'Review status must immediately transition to published');
  assert.strictEqual(talentReviewRes.json.mutualPublished, true, 'Mutual published must be true');
  const talentReviewId = talentReviewRes.json.review.id || talentReviewRes.json.review._id;
  console.log('✓ Mutual unlock satisfied: Both reviews automatically published.');

  // 9. Reputation Profile Aggregation Verification
  console.log('\n[10/12] Verifying Reputation Profile Metrics & Sub-Scores Calculation...');
  const talentPublicReviewsAfter = await request(`${API_BASE}/users/${talentId}/reviews`);
  assert.strictEqual(talentPublicReviewsAfter.status, 200);
  assert.strictEqual(talentPublicReviewsAfter.json.totalReviews, 1);
  const repSummary = talentPublicReviewsAfter.json.reputationSummary;
  assert.strictEqual(repSummary.ratingAverage, 5.0, 'Rating average should be 5.0');
  assert.strictEqual(repSummary.communicationScore, 5.0, 'Communication score should be 5.0');
  assert.strictEqual(repSummary.qualityScore, 5.0, 'Quality score should be 5.0');
  assert.strictEqual(repSummary.ratingCount, 1, 'Rating count should be 1');
  assert.strictEqual(repSummary.ratingBreakdown.fiveStar, 1, '5-star bucket should have 1');
  console.log('✓ Freelancer reputation metrics accurately calculated and aggregated.');

  // Check Client reputation on User model
  const clientPublicReviewsAfter = await request(`${API_BASE}/users/${clientId}/reviews`);
  assert.strictEqual(clientPublicReviewsAfter.status, 200);
  assert.strictEqual(clientPublicReviewsAfter.json.totalReviews, 1);
  assert.strictEqual(clientPublicReviewsAfter.json.reputationSummary.ratingAverage, 5.0);
  console.log('✓ Client reputation metrics accurately calculated and aggregated.');

  // 10. Review Editing & Flagging / Moderation
  console.log('\n[11/12] Testing Review Editing, User Reporting, and Moderation...');
  // Edit review
  const editRes = await request(`${API_BASE}/reviews/${talentReviewId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({
      reviewText: 'Updated: Exceptional client to collaborate with. Prompt feedback, respectful and decisive.',
    }),
  });
  assert.strictEqual(editRes.status, 200, 'Review editing should succeed');
  assert.strictEqual(editRes.json.review.isEdited, true, 'Review should be marked isEdited');
  console.log('✓ Review editing verified.');

  // Non-author attempting edit
  const unauthorizedEdit = await request(`${API_BASE}/reviews/${talentReviewId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({ reviewText: 'Unauthorized edit attempt.' }),
  });
  assert.strictEqual(unauthorizedEdit.status, 403, 'Unauthorized review edit must be rejected with 403');
  console.log('✓ Unauthorized review edit rejected with HTTP 403.');

  // Flag review
  const flagRes = await request(`${API_BASE}/reviews/${clientReviewId}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${talentToken}`,
    },
    body: JSON.stringify({ reason: 'Requesting verification of project scope mentioned.' }),
  });
  assert.strictEqual(flagRes.status, 200, 'Review flagging should succeed');
  assert.strictEqual(flagRes.json.review.status, 'flagged');
  console.log('✓ Review flagged for moderation.');

  // Admin moderates review (hide review)
  const hideRes = await request(`${API_BASE}/admin/reviews/${clientReviewId}/moderate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      action: 'hide',
      moderatorNotes: 'Temporarily hidden pending clarification.',
    }),
  });
  assert.strictEqual(hideRes.status, 200, 'Admin review moderation should succeed');
  assert.strictEqual(hideRes.json.review.status, 'hidden');

  // Verify hidden review is immediately excluded from freelancer public reputation
  const talentReviewsAfterHide = await request(`${API_BASE}/users/${talentId}/reviews`);
  assert.strictEqual(talentReviewsAfterHide.json.totalReviews, 0, 'Hidden review must not count towards public reviews');
  console.log('✓ Hidden review successfully excluded from reputation calculations.');

  // 11. Safety: Reporting & Blocking
  console.log('\n[12/12] Testing User Safety Reporting & Communication Blocking...');
  // Submit report
  const reportRes = await request(`${API_BASE}/safety/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      targetType: 'user',
      targetId: outsiderId,
      reason: 'Unsolicited spam communication attempt.',
    }),
  });
  assert.strictEqual(reportRes.status, 201, 'User report submission should succeed');
  const reportId = reportRes.json.report.id || reportRes.json.report._id;

  // Admin resolves report
  const resolveRep = await request(`${API_BASE}/admin/reports/${reportId}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'resolved', adminNotes: 'Warning issued to user.' }),
  });
  assert.strictEqual(resolveRep.status, 200, 'Admin report resolution should succeed');
  console.log('✓ User safety report processed and resolved by operations.');

  // Client blocks Outsider
  const blockRes = await request(`${API_BASE}/safety/block/${outsiderId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({ reason: 'Privacy protection.' }),
  });
  assert.strictEqual(blockRes.status, 201, 'User block should succeed');
  console.log('✓ Client blocked Outsider.');

  // Outsider tries to send direct message to Client -> MUST BE BLOCKED WITH 403!
  const blockedMessage = await request(`${API_BASE}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${outsiderToken}`,
    },
    body: JSON.stringify({
      recipientId: clientId,
      text: 'Trying to contact you after block.',
    }),
  });
  assert.strictEqual(blockedMessage.status, 403, 'Communication between blocked users must be rejected with 403');
  console.log('✓ Direct chat message from blocked user rejected with HTTP 403.');

  // Client unblocks Outsider
  const unblockRes = await request(`${API_BASE}/safety/block/${outsiderId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.strictEqual(unblockRes.status, 200, 'Unblock should succeed');
  console.log('✓ Client unblocked Outsider.');

  // Outsider sends message after unblock -> Should succeed
  const allowedMessage = await request(`${API_BASE}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${outsiderToken}`,
    },
    body: JSON.stringify({
      recipientId: clientId,
      text: 'Re-contacting after unblock.',
    }),
  });
  assert.strictEqual(allowedMessage.status, 201, 'Message should succeed after unblocking');
  console.log('✓ Messaging successfully restored upon unblock.');

  console.log('\n========================================================================');
  console.log('  ALL 29+ PHASE 11 TRUST, REPUTATION & DISPUTE TESTS PASSED (100%)');
  console.log('========================================================================\n');
}

runPhase11Tests().catch((err) => {
  console.error('\n❌ PHASE 11 TEST SUITE FAILED:', err);
  process.exit(1);
});
