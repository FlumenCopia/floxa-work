# FLOXA Work — Continuous Integration & Continuous Delivery (CI/CD) Workflow

**Platform:** GitHub Actions / Standard Linux Container Runner  
**Workflow File:** `.github/workflows/ci.yml`  
**Date:** 14 November 2026  

---

## 1. Pipeline Architecture & Quality Gates

The FLOXA Work automated CI/CD pipeline enforces 8 strict quality gates before any code merges or deploys to staging or production:

```
┌─────────────────────────────────────────────────────────────┐
│                    GIT PUSH / PULL REQUEST                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│     BACKEND VERIFICATION      │   │     FRONTEND VERIFICATION     │
│  1. npm ci (Lockfile Check)   │   │  1. npm ci (Lockfile Check)   │
│  2. TypeScript compile (tsc)  │   │  2. Next.js App Router Build  │
│  3. Spin up MongoDB 8.0 container│ 3. React 19 Bundle Tree-Shake │
│  4. Run All 8 Test Suites     │   │  4. Zero secret leak check    │
└───────────────────────────────┘   └───────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   DEPLOYMENT APPROVAL GATE                  │
│   - Automatic staging deployment upon master push           │
│   - Manual signed approval required for production release  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Secrets Management in CI/CD

- All CI secrets are supplied through GitHub Repository Secrets (`ACTIONS_RUNNER_SECRET`).
- Zero production credentials exist in workflow YAML files.
- The pipeline executes against isolated ephemeral MongoDB containers with random cryptographic seeds.

