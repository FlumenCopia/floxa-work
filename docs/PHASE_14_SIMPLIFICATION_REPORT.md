# FLOXA Work — Phase 14 Simplification & Optimization Report

**Project:** FLOXA Work  
**Phase:** 14 — Lean Architecture, Stability & Early User Launch Preparation  
**Date:** 14 November 2026  

---

## 1. What Was Kept (Critical Core)

1. **Foundational Security & Auth:** Bcrypt password hashing (cost 12), 15-minute access tokens, single-use refresh tokens with rotation and replay detection, session revocation, reason-backed account suspension, and strict token redaction in production HTTP responses.
2. **Granular Role Governance:** 5-tier role hierarchy (`super_admin`, `operations_admin`, `trust_safety_moderator`, `support_operator`, `analytics_viewer`) guarded by server-side `requireAdminPermission` middleware.
3. **Private File Storage Authorization:** Deliverable files stored in isolated vaults (`media/private_vault/`) with path traversal rejection and contract participant authorization.
4. **Lightweight WebSockets:** In-process native `ws` on `/ws` with 64KB max payload bounds, verified JWT checking for contract rooms, and 25-second heartbeat ping/pong.
5. **Observability Probes:** Native `/health/live` and `/health/ready` endpoints with MongoDB ping telemetry.
6. **Automated Verification:** Standalone database backup and restore scripts verifying SHA-256 integrity against isolated test databases.
7. **Non-Custodial Direct Settlement Invariant:** Zero platform escrow, wallets, or automated disbursement. Complete separation between contractual scope values and user-reported external bank/UPI payments.

---

## 2. What Was Simplified

1. **Database Connection Pool:** Reduced default `DB_MAX_POOL_SIZE` from 50 to 25, and `DB_MIN_POOL_SIZE` to 2. This prevents exhausting shared connection limits on entry-tier MongoDB Atlas clusters (M0/M2).
2. **Storage Architecture:** Standardized on `LocalStorageProvider` for single-instance hosting with zero cloud bill. S3/R2 remains a simple 3-variable environment drop-in when migrating to serverless.
3. **Logging & Tracing:** Maintained structured JSON stdout logging with `X-Request-Id` correlation, avoiding expensive third-party enterprise APM agents.
4. **CI/CD Workflow:** Retained a concise, repeatable GitHub Actions workflow running in standard Ubuntu containers with an ephemeral MongoDB instance.

---

## 3. What Was Deferred (Premature Scaling Avoided)

| Component | Deferred Technology | Reason for Deferral | Trigger for Re-evaluation |
| :--- | :--- | :--- | :--- |
| **Container Orchestration**| Kubernetes / EKS / ECS | Unnecessary operational overhead for single backend | Team reaches > 10 full-time backend engineers |
| **Distributed Cache** | Redis / Memcached | In-memory token rotation & MongoDB indexes handle 10k users | Cache saturation or multi-instance session synchronization |
| **Message Queue** | RabbitMQ / Kafka / SQS | In-process non-blocking dispatch is sufficient for transactional alerts | Background job queue exceeds 1,000 tasks/min |
| **WebRTC Media Server** | LiveKit / Janus SFU | Peer-to-peer audio/video with STUN is sufficient for 1-on-1 calls | Need for multi-party group video calls (> 4 people) |
| **Multi-Region Disaster Recovery** | Cross-cloud WORM replication | Atlas automated daily backups and JSON dumps satisfy early RPO/RTO | Enterprise compliance contracts requiring multi-region SLAs |

---

## 4. What Was Fixed

1. **Transactional Email Wiring:** Imported `emailService` into `auth.controller.ts` for password reset (`POST /api/auth/forgot-password`) and email verification (`POST /api/auth/request-email-verification`). Added non-blocking dispatch with graceful log fallback.
2. **API Route Aliasing:** Added route aliases so both `POST /proposals` and `POST /briefs/:briefId/proposals` work seamlessly, and both `POST /contracts` and `POST /proposals/:proposalId/accept` are supported.
3. **Database Restore Isolation:** Updated `backup-database.cjs` and `restore-database.cjs` to use isolated connection instances (`createConnection`), preventing global mongoose disconnects during automated test runs.
