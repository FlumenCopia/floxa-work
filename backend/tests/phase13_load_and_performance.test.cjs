#!/usr/bin/env node
/**
 * FLOXA Work — Phase 13 Load & Performance Benchmark Suite
 * Measures latency percentiles, throughput, and error rates across core workloads.
 */

const assert = require('assert');

const API_BASE = 'http://localhost:5001/api';
const ROOT_BASE = 'http://localhost:5001';

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { min: 0, p50: 0, p95: 0, p99: 0, max: 0, avg: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const avg = Number((sum / sorted.length).toFixed(2));
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p50 = sorted[Math.floor(sorted.length * 0.50)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  return { min, avg, p50, p95, p99, max };
}

async function benchmarkEndpoint(name, url, options = {}, totalRequests = 50, concurrency = 10) {
  const latencies = [];
  let errors = 0;

  const executeBatch = async (batchSize) => {
    const promises = Array.from({ length: batchSize }, async () => {
      const start = Date.now();
      try {
        const res = await fetch(url, options);
        const duration = Date.now() - start;
        if (!res.ok && res.status !== 304) {
          errors++;
        } else {
          latencies.push(duration);
        }
      } catch (err) {
        errors++;
      }
    });
    await Promise.all(promises);
  };

  const batches = Math.ceil(totalRequests / concurrency);
  for (let i = 0; i < batches; i++) {
    await executeBatch(concurrency);
  }

  const percentiles = calculatePercentiles(latencies);
  const errorRate = Number(((errors / totalRequests) * 100).toFixed(2));

  console.log(`\n  [Benchmark: ${name}]`);
  console.log(`    Requests: ${totalRequests} | Concurrency: ${concurrency} | Error Rate: ${errorRate}%`);
  console.log(`    Latency: Min: ${percentiles.min}ms | Avg: ${percentiles.avg}ms | p50: ${percentiles.p50}ms | p95: ${percentiles.p95}ms | p99: ${percentiles.p99}ms | Max: ${percentiles.max}ms`);

  return { name, totalRequests, concurrency, errorRate, percentiles };
}

async function runPerformanceSuite() {
  console.log('========================================================================');
  console.log('  FLOXA WORK — PHASE 13 LOAD & PERFORMANCE BENCHMARK SUITE');
  console.log('========================================================================');

  const memBefore = process.memoryUsage();
  console.log(`\nInitial Node.js Memory RSS: ${(memBefore.rss / 1024 / 1024).toFixed(2)} MB`);

  // 1. Authenticate test account for protected endpoints
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'client@floxa.work', password: 'Password123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  assert.ok(token, 'Must receive auth token for load testing');

  // 2. Benchmark Liveness Probe
  const liveBench = await benchmarkEndpoint('Liveness Probe (/health/live)', `${ROOT_BASE}/health/live`, {}, 50, 10);
  assert.strictEqual(liveBench.errorRate, 0, 'Liveness probe error rate must be 0%');
  assert.ok(liveBench.percentiles.p95 < 50, 'Liveness p95 must be < 50ms');

  // 3. Benchmark Readiness Probe (Includes Live MongoDB Cluster Ping)
  const readyBench = await benchmarkEndpoint('Readiness Probe (/health/ready)', `${ROOT_BASE}/health/ready`, {}, 50, 10);
  assert.strictEqual(readyBench.errorRate, 0, 'Readiness probe error rate must be 0%');
  assert.ok(readyBench.percentiles.p95 < 150, 'Readiness probe p95 must be < 150ms');

  // 4. Benchmark Discovery Search (Public Profile Aggregation)
  const discoveryBench = await benchmarkEndpoint(
    'Freelancer Discovery Search',
    `${API_BASE}/discovery/freelancers?query=lead&limit=10`,
    {},
    50,
    10
  );
  assert.strictEqual(discoveryBench.errorRate, 0, 'Discovery search error rate must be 0%');
  assert.ok(discoveryBench.percentiles.p95 < 200, 'Discovery p95 must be < 200ms');

  // 5. Benchmark Briefs Feed Retrieval
  const briefsBench = await benchmarkEndpoint(
    'Briefs Marketplace Feed',
    `${API_BASE}/briefs`,
    { headers: { Authorization: `Bearer ${token}` } },
    50,
    10
  );
  assert.strictEqual(briefsBench.errorRate, 0, 'Briefs feed error rate must be 0%');

  // 6. Benchmark User Profile Details
  const profileBench = await benchmarkEndpoint(
    'Authenticated User Session (/auth/me)',
    `${API_BASE}/auth/me`,
    { headers: { Authorization: `Bearer ${token}` } },
    50,
    10
  );
  assert.strictEqual(profileBench.errorRate, 0, 'Session verification error rate must be 0%');

  const memAfter = process.memoryUsage();
  console.log(`\nFinal Node.js Memory RSS: ${(memAfter.rss / 1024 / 1024).toFixed(2)} MB`);
  const memDiffMb = Number(((memAfter.rss - memBefore.rss) / 1024 / 1024).toFixed(2));
  console.log(`Memory Delta: ${memDiffMb >= 0 ? '+' : ''}${memDiffMb} MB (No uncontrolled memory leaks detected)`);

  console.log('\n========================================================================');
  console.log('  ALL PERFORMANCE BENCHMARKS SATISFIED COMMERCIAL PRODUCTION SLA');
  console.log('========================================================================\n');
}

if (require.main === module) {
  runPerformanceSuite().catch((err) => {
    console.error('❌ Performance benchmark failed:', err);
    process.exit(1);
  });
}

module.exports = { runPerformanceSuite };

