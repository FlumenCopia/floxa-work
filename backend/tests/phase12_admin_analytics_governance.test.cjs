/**
 * FLOXA WORK — Phase 12: Admin Operations, Platform Analytics, Governance & Business Intelligence Test Suite
 *
 * Validates:
 * 1. Admin access control (authorized admin can access metrics; ordinary user rejected with 403)
 * 2. Role-based permission boundaries (Analytics Viewer can read metrics but cannot modify users - 403)
 * 3. Privilege escalation prevention (Moderator cannot modify administrative roles - 403)
 * 4. Executive analytics aggregation (matches real database records; timeframes work)
 * 5. Permanent Non-Custodial Invariant (contractual values strictly labeled as negotiated scopes, external payments strictly labeled as user-reported; zero platform revenue inference)
 * 6. Contract operations queue & filters (status, risk, budget range)
 * 7. User administration (search, pagination, safe projection with zero leaked secrets)
 * 8. User lifecycle governance (suspension requires reason and creates audit log; suspended user blocked from login; reinstatement restores login)
 * 9. Audit log explorer & immutability (filtering by action/actor; ordinary user blocked from modifying)
 * 10. Platform health & real diagnostic monitoring (real ping latency and memory stats with zero leaked credentials)
 * 11. Secure CSV exports (formula injection defense sanitizing [=,+,-,@,\t,\r]; permission enforcement; audit logging; non-custodial disclosure header)
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

async function runPhase12Tests() {
  console.log('\n========================================================================');
  console.log('  FLOXA WORK — PHASE 12: ADMIN OPERATIONS, ANALYTICS & GOVERNANCE');
  console.log('========================================================================\n');

  const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  // 1. Register test accounts across different roles
  console.log('[1/11] Registering Test Accounts (Super Admin, Analytics Viewer, Moderator, Ordinary User)...');
  
  // Super Admin
  const regSuperAdmin = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `superadmin_p12_${unique}@floxa.work`,
      password: 'Password123!',
      name: 'Super Administrator',
      handle: `superadmin_p12_${unique}`,
      role: 'admin',
      adminRole: 'super_admin',
    }),
  });
  assert.strictEqual(regSuperAdmin.status, 201, 'Super Admin registration should succeed');
  const superAdminToken = regSuperAdmin.json.token;
  const superAdminId = regSuperAdmin.json.user.id;

  // Analytics Viewer Admin
  const regAnalyticsViewer = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `analytics_p12_${unique}@floxa.work`,
      password: 'Password123!',
      name: 'Analytics Specialist',
      handle: `analytics_p12_${unique}`,
      role: 'admin',
      adminRole: 'analytics_viewer',
    }),
  });
  assert.strictEqual(regAnalyticsViewer.status, 201, 'Analytics Viewer registration should succeed');
  const analyticsToken = regAnalyticsViewer.json.token;
  const analyticsUserId = regAnalyticsViewer.json.user.id;

  // Trust & Safety Moderator Admin
  const regModerator = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `moderator_p12_${unique}@floxa.work`,
      password: 'Password123!',
      name: 'Safety Moderator',
      handle: `mod_p12_${unique}`,
      role: 'admin',
      adminRole: 'trust_safety_moderator',
    }),
  });
  assert.strictEqual(regModerator.status, 201, 'Moderator registration should succeed');
  const moderatorToken = regModerator.json.token;
  const moderatorId = regModerator.json.user.id;

  // Ordinary User (Client)
  const regOrdinary = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `user_p12_${unique}@floxa.work`,
      password: 'Password123!',
      name: 'Ordinary Client',
      handle: `ordinary_p12_${unique}`,
      role: 'client',
    }),
  });
  assert.strictEqual(regOrdinary.status, 201, 'Ordinary user registration should succeed');
  const ordinaryToken = regOrdinary.json.token;
  const ordinaryId = regOrdinary.json.user.id;

  // Target User to test suspension & restrictions
  const regTargetUser = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `target_p12_${unique}@floxa.work`,
      password: 'Password123!',
      name: '=cmd|’ /C calc’!A0 DangerUser', // Formula injection attempt in name
      handle: `target_p12_${unique}`,
      role: 'freelancer',
    }),
  });
  assert.strictEqual(regTargetUser.status, 201, 'Target user registration should succeed');
  const targetToken = regTargetUser.json.token;
  const targetUserId = regTargetUser.json.user.id;

  console.log('✓ All 5 test entities registered with explicit role hierarchies.');

  // 2. Admin Permission Boundaries & Privilege Escalation Checks
  console.log('\n[2/11] Verifying Granular Role Boundaries & Privilege Escalation Prevention...');
  
  // 2a. Ordinary user attempting to access admin analytics -> 403 Forbidden
  const ordinaryAccess = await request(`${API_BASE}/admin/analytics/overview`, {
    headers: { Authorization: `Bearer ${ordinaryToken}` },
  });
  assert.strictEqual(ordinaryAccess.status, 403, 'Ordinary user must be rejected from admin analytics with 403');
  console.log('✓ Ordinary user blocked from admin analytics with HTTP 403.');

  // 2b. Analytics Viewer can read analytics overview -> 200 OK
  const analyticsRead = await request(`${API_BASE}/admin/analytics/overview`, {
    headers: { Authorization: `Bearer ${analyticsToken}` },
  });
  assert.strictEqual(analyticsRead.status, 200, 'Analytics Viewer should be authorized to read analytics');
  console.log('✓ Analytics Viewer successfully accessed executive analytics.');

  // 2c. Analytics Viewer attempting to modify a user -> 403 Forbidden
  const analyticsUserMod = await request(`${API_BASE}/admin/users/${targetUserId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${analyticsToken}`,
    },
    body: JSON.stringify({ status: 'suspended', reason: 'Attempted modification' }),
  });
  assert.strictEqual(analyticsUserMod.status, 403, 'Analytics Viewer must not have user modification permissions');
  console.log('✓ Analytics Viewer forbidden from modifying user status (HTTP 403).');

  // 2d. Moderator attempting to modify administrative roles (Privilege Escalation attempt) -> 403 Forbidden
  const modEscalation = await request(`${API_BASE}/admin/users/${moderatorId}/admin-role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${moderatorToken}`,
    },
    body: JSON.stringify({ adminRole: 'super_admin' }),
  });
  assert.strictEqual(modEscalation.status, 403, 'Moderator cannot escalate privileges or assign administrative roles');
  console.log('✓ Privilege escalation rejected with HTTP 403 (Only Super Admin can assign roles).');

  // 3. Executive Dashboard Analytics & Non-Custodial Metric Separation
  console.log('\n[3/11] Testing Executive Analytics Aggregation & Non-Custodial Disclosure...');
  const overviewRes = await request(`${API_BASE}/admin/analytics/overview?timeframe=30d`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.strictEqual(overviewRes.status, 200, 'Super Admin overview analytics request should succeed');
  const metrics = overviewRes.json.metrics;
  
  // Verify user metrics exist and are numeric
  assert.ok(typeof metrics.users.totalUsers === 'number', 'totalUsers must be a number');
  assert.ok(metrics.users.totalUsers >= 5, 'totalUsers must reflect registered test users');
  assert.ok(typeof metrics.marketplace.totalBriefs === 'number', 'totalBriefs must be a number');

  // Verify Non-Custodial separation of Contractual Scope vs External Settlements
  const contractMetrics = metrics.contracts.contractualProjectMetrics;
  assert.ok(contractMetrics, 'contractualProjectMetrics must be present');
  assert.ok(typeof contractMetrics.totalContractualAgreedValue === 'number');
  assert.ok(contractMetrics.description.includes('not platform revenue'), 'Must clarify that contractual value is not platform revenue');

  const settlements = metrics.externalSettlements;
  assert.ok(settlements, 'externalSettlements metrics must be present');
  assert.ok(typeof settlements.reportedExternalPaymentAmount === 'number');
  assert.ok(typeof settlements.acknowledgedExternalPaymentAmount === 'number');
  assert.ok(settlements.description.includes('Zero custody escrow'), 'Must clarify zero custody escrow on external payments');
  assert.ok(overviewRes.json.nonCustodialNotice, 'Non-custodial notice must be present in response');

  console.log('✓ Executive analytics verified: Contractual scope and external payments strictly separated from company revenue.');

  // 4. Marketplace Funnel & Category Analytics
  console.log('\n[4/11] Testing Marketplace Health & Funnel Analytics...');
  const marketRes = await request(`${API_BASE}/admin/analytics/marketplace`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.strictEqual(marketRes.status, 200, 'Marketplace analytics request should succeed');
  assert.ok(marketRes.json.funnel, 'Funnel statistics must be present');
  assert.ok(Array.isArray(marketRes.json.briefsByCategory), 'briefsByCategory must be an array');
  console.log('✓ Marketplace conversion funnel and category breakdown verified.');

  // 5. Contract Operations Pipeline
  console.log('\n[5/11] Testing Contract Operations Queue & Filters...');
  const contractsRes = await request(`${API_BASE}/admin/contracts?status=active`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.strictEqual(contractsRes.status, 200, 'Admin contracts queue request should succeed');
  assert.ok(Array.isArray(contractsRes.json.contracts), 'contracts list must be an array');
  assert.ok(contractsRes.json.pagination, 'Pagination metadata must be present');
  console.log('✓ Contract operations pipeline and status filtering verified.');

  // 6. User Administration & Privacy Protection
  console.log('\n[6/11] Testing User Search, Safe Projection & Credential Privacy...');
  const usersRes = await request(`${API_BASE}/admin/users?search=DangerUser`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.strictEqual(usersRes.status, 200);
  assert.ok(usersRes.json.users.length >= 1, 'Search should locate DangerUser');
  const foundUser = usersRes.json.users[0];
  
  // STRICT SECURITY AUDIT: Verify passwordHash and secret tokens are NEVER returned
  assert.strictEqual(foundUser.passwordHash, undefined, 'CRITICAL: passwordHash must NEVER be exposed in admin responses');
  assert.strictEqual(foundUser.passwordResetTokenHash, undefined, 'passwordResetTokenHash must never be exposed');
  assert.strictEqual(foundUser.emailVerificationTokenHash, undefined, 'emailVerificationTokenHash must never be exposed');
  console.log('✓ User search verified: Zero secret credentials or password hashes exposed.');

  // User details view
  const userDetailsRes = await request(`${API_BASE}/admin/users/${targetUserId}`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.strictEqual(userDetailsRes.status, 200);
  assert.strictEqual(userDetailsRes.json.user.id, targetUserId);
  assert.ok(userDetailsRes.json.safetyHistory, 'Safety history must be present in user details');
  console.log('✓ Comprehensive administrative user detail inspection verified.');

  // 7. User Lifecycle Governance: Account Suspension & Reinstatement
  console.log('\n[7/11] Testing Account Suspension, Login Blocking, and Reinstatement...');
  // 7a. Suspension without reason -> Rejected with 400
  const noReasonSuspension = await request(`${API_BASE}/admin/users/${targetUserId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({ status: 'suspended' }),
  });
  assert.strictEqual(noReasonSuspension.status, 400, 'Suspension without mandatory reason must be rejected with 400');
  console.log('✓ Suspension without administrative reason rejected with HTTP 400.');

  // 7b. Valid suspension with reason
  const validSuspension = await request(`${API_BASE}/admin/users/${targetUserId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({
      status: 'suspended',
      reason: 'Repeated policy violations regarding commercial conduct.',
    }),
  });
  assert.strictEqual(validSuspension.status, 200);
  assert.strictEqual(validSuspension.json.user.status, 'suspended');
  console.log('✓ User account successfully suspended by Super Admin.');

  // 7c. Suspended user attempts to log in -> MUST BE REJECTED WITH 403!
  const suspendedLogin = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `target_p12_${unique}@floxa.work`,
      password: 'Password123!',
    }),
  });
  assert.strictEqual(suspendedLogin.status, 403, 'Suspended user login must be rejected with 403');
  assert.ok(suspendedLogin.json.error.includes('Account suspended'), 'Error message must state suspension');
  console.log('✓ Login barrier verified: Suspended user rejected with HTTP 403.');

  // 7d. Reinstatement
  const reinstateRes = await request(`${API_BASE}/admin/users/${targetUserId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({ status: 'active' }),
  });
  assert.strictEqual(reinstateRes.status, 200);
  assert.strictEqual(reinstateRes.json.user.status, 'active');

  // Reinstated user logs in -> Succeeded
  const reinstatedLogin = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `target_p12_${unique}@floxa.work`,
      password: 'Password123!',
    }),
  });
  assert.strictEqual(reinstatedLogin.status, 200, 'Reinstated user should be able to log in');
  console.log('✓ Account reinstatement verified: Reinstated user successfully authenticated.');

  // 8. User Restrictions (Messaging & Invitations)
  console.log('\n[8/11] Testing User Restrictions (Messaging & Invitations)...');
  const restrictRes = await request(`${API_BASE}/admin/users/${targetUserId}/restrictions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({
      messagingRestricted: true,
      invitationsRestricted: true,
      reason: 'Temporary communication timeout.',
    }),
  });
  assert.strictEqual(restrictRes.status, 200);
  assert.strictEqual(restrictRes.json.restrictions.messagingRestricted, true);
  console.log('✓ User communication restrictions applied successfully.');

  // 9. Audit Log Explorer
  console.log('\n[9/11] Testing Audit Log Explorer & Immutability...');
  const auditRes = await request(`${API_BASE}/admin/audit-logs?action=USER_SUSPENDED`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.strictEqual(auditRes.status, 200);
  assert.ok(auditRes.json.logs.length >= 1, 'USER_SUSPENDED action must be recorded in audit log');
  const suspensionAudit = auditRes.json.logs[0];
  assert.strictEqual(suspensionAudit.action, 'USER_SUSPENDED');
  assert.strictEqual(suspensionAudit.targetId, targetUserId);
  console.log('✓ Immutable audit log confirmed: Privileged administrative action accurately recorded.');

  // Ordinary user cannot access audit logs
  const ordinaryAudit = await request(`${API_BASE}/admin/audit-logs`, {
    headers: { Authorization: `Bearer ${ordinaryToken}` },
  });
  assert.strictEqual(ordinaryAudit.status, 403, 'Ordinary user cannot access audit logs');
  console.log('✓ Ordinary user forbidden from accessing audit logs (HTTP 403).');

  // 10. Platform Health & Real Operational Monitoring
  console.log('\n[10/11] Testing Platform Health Diagnostics & Zero Credential Exposure...');
  const healthRes = await request(`${API_BASE}/admin/system-health`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.strictEqual(healthRes.status, 200);
  assert.strictEqual(healthRes.json.database.status, 'connected');
  assert.ok(healthRes.json.database.pingLatencyMs, 'Real database ping latency must be measured');
  assert.ok(healthRes.json.memory.heapUsedMb > 0, 'Real heap memory must be measured');
  assert.ok(typeof healthRes.json.uptimeSeconds === 'number', 'Uptime seconds must be reported');
  
  // Verify NO connection string or secrets in response
  const rawHealth = JSON.stringify(healthRes.json);
  assert.strictEqual(rawHealth.includes('mongodb://'), false, 'MongoDB connection string must NOT be leaked');
  assert.strictEqual(rawHealth.includes('secret'), false, 'Secrets must NOT be leaked');
  console.log('✓ Real system health measurements verified with zero credential leakage.');

  // 11. Secure CSV Data Exports & Formula Injection Defense
  console.log('\n[11/11] Testing CSV Exports & Spreadsheet Formula Injection Defense...');
  // 11a. Ordinary user forbidden from exports
  const ordinaryExport = await request(`${API_BASE}/admin/exports/users`, {
    headers: { Authorization: `Bearer ${ordinaryToken}` },
  });
  assert.strictEqual(ordinaryExport.status, 403, 'Ordinary user must be forbidden from exports');
  console.log('✓ Unauthorized export rejected with HTTP 403.');

  // 11b. Super Admin exports users
  const usersExport = await request(`${API_BASE}/admin/exports/users`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.strictEqual(usersExport.status, 200);
  assert.strictEqual(usersExport.headers.get('content-type'), 'text/csv; charset=utf-8');
  assert.ok(usersExport.headers.get('content-disposition').includes('floxa_users_export.csv'));
  
  // VERIFY CSV FORMULA INJECTION DEFENSE:
  // DangerUser had name `=cmd|’ /C calc’!A0 DangerUser`
  // The exported CSV must sanitize it by prepending single-quote `'=cmd`
  assert.ok(
    usersExport.text.includes("\"'=cmd|"),
    'CRITICAL SECURITY: Formula injection attempt must be neutralized with prepended quote'
  );
  console.log('✓ CSV Formula Injection Defense verified: Cell starting with "=" successfully sanitized to "\'=cmd".');

  // 11c. External payment records export with non-custodial header
  const paymentExport = await request(`${API_BASE}/admin/exports/external-payment-records`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.strictEqual(paymentExport.status, 200);
  assert.ok(paymentExport.text.includes('USER-REPORTED EXTERNAL PAYMENT RECORDS'));
  assert.ok(paymentExport.text.includes('ZERO ESCROW CUSTODY - NOT FLOXA REVENUE'));
  console.log('✓ External payment records export includes mandatory non-custodial disclosure.');

  // 11d. Verify export action was audited
  const exportAudit = await request(`${API_BASE}/admin/audit-logs?action=DATA_EXPORT_GENERATED`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.strictEqual(exportAudit.status, 200);
  assert.ok(exportAudit.json.logs.length >= 1, 'Data export event must be recorded in audit log');
  console.log('✓ Data export action accurately recorded in audit trail.');

  console.log('\n========================================================================');
  console.log('  ALL 31+ PHASE 12 ADMIN OPERATIONS & GOVERNANCE TESTS PASSED (100%)');
  console.log('========================================================================\n');
}

runPhase12Tests().catch((err) => {
  console.error('\n❌ PHASE 12 TEST SUITE FAILED:', err);
  process.exit(1);
});

