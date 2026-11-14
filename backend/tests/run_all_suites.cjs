/**
 * FLOXA WORK — MASTER REGRESSION TEST HARNESS
 * Executes all 13 test suites across Phases 8-16 and compiles consolidated report.
 */

const { execSync } = require('child_process');
const path = require('path');

const suites = [
  { name: 'Phase 8: Proposal Comparison Engine', file: 'phase8_proposal_comparison.test.cjs' },
  { name: 'Phase 9: Discovery & Intelligent Matching', file: 'phase9_discovery_and_matching.test.cjs' },
  { name: 'Phase 10: Collaboration Workspace & Milestones', file: 'phase10_project_workspace.test.cjs' },
  { name: 'Phase 11: Trust, Reputation, Reviews & Disputes', file: 'phase11_trust_reputation_disputes.test.cjs' },
  { name: 'Phase 12: Admin Operations & Platform Governance', file: 'phase12_admin_analytics_governance.test.cjs' },
  { name: 'Phase 13: Production Readiness & Hardening', file: 'phase13_production_readiness.test.cjs' },
  { name: 'Phase 13: Concurrency Load & Latency Benchmarks', file: 'phase13_load_and_performance.test.cjs' },
  { name: 'Phase 14: Lean Architecture & Resource Bounds', file: 'phase14_lean_architecture.test.cjs' },
  { name: 'Security & Payment Integrity Verification', file: 'security_and_payment_integrity.test.cjs' },
  { name: 'Production End-to-End Real DB Lifecycle', file: 'production_e2e_verification.test.cjs' },
  { name: 'Phase 15: Marketplace UX & Acceptance Snapshot', file: 'phase15_user_experience.test.cjs' },
  { name: 'Phase 16: Real User Journeys & Launch Candidate', file: 'phase16_real_user_journeys.test.cjs' },
  { name: 'Phase 16: WCAG 2.1 AA Accessibility & Contrast', file: 'phase16_accessibility_audit.test.cjs' },
];

console.log('\n========================================================================');
console.log('  FLOXA WORK — MASTER REGRESSION HARNESS (ALL 13 TEST SUITES)');
console.log('========================================================================\n');

let passed = 0;
let failed = 0;
const results = [];

suites.forEach((suite, idx) => {
  const fullPath = path.resolve(__dirname, suite.file);
  process.stdout.write(`[${idx + 1}/${suites.length}] Running ${suite.name}... `);
  const start = Date.now();
  try {
    execSync(`node "${fullPath}"`, { stdio: 'pipe' });
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`PASSED (${duration}s)`);
    results.push({ name: suite.name, file: suite.file, status: 'PASSED', duration: `${duration}s` });
    passed++;
  } catch (err) {
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`FAILED (${duration}s)`);
    results.push({ name: suite.name, file: suite.file, status: 'FAILED', duration: `${duration}s`, error: err.message });
    failed++;
  }
});

console.log('\n========================================================================');
console.log(`  MASTER REGRESSION RESULT: ${passed}/${suites.length} SUITES PASSED (${failed === 0 ? '100% SUCCESS' : 'FAILURES DETECTED'})`);
console.log('========================================================================\n');

results.forEach((r) => {
  console.log(`  - [${r.status}] ${r.name} (${r.duration})`);
});

if (failed > 0) {
  process.exit(1);
}

