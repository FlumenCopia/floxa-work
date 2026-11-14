# FLOXA Work — Production Deployment Guide

**Target Environment:** Commercial Production  
**Target Domain:** `floxa.work` & `api.floxa.work`  
**Execution Standard:** Zero-Downtime Blue/Green or Rolling Deployment  
**Date:** 14 November 2026  

---

## 1. Pre-Deployment Readiness Checklist

Before triggering production release, confirm the following prerequisites:
- [x] All 8 test suites pass with 100% success on the release Git commit.
- [x] Production environment secrets are provisioned in Cloud Secret Manager (Doppler / AWS Secrets Manager).
- [x] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are cryptographically random ($\ge 32$ characters) and distinct from development keys.
- [x] MongoDB Atlas production cluster backup snapshot has been created.
- [x] Cloudflare R2 / AWS S3 private object storage bucket is provisioned with private ACL.
- [x] Transactional email provider (Mailgun/SendGrid) SPF, DKIM, and DMARC DNS records are verified.

---

## 2. Production Rollout Procedure

```
┌─────────────────────────────────────────────────────────────┐
│ 1. BACKUP DATABASE SNAPSHOT                                 │
│    mongodump --uri="<PROD_URI>" --archive=prod_backup.gz    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SYNC MONGODB INDEXES (Non-blocking)                      │
│    node dist/config/indexManager.js                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ROLLING BACKEND DEPLOYMENT (Zero-Downtime Drain)         │
│    pm2 reload floxa-backend --update-env                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. VERIFY READINESS PROBES                                  │
│    curl -f https://api.floxa.work/health/ready              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. ATOMIC FRONTEND DEPLOYMENT & CACHE PURGE                 │
│    Cloudflare edge cache purge for new static assets        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Post-Deployment Verification (Smoke Test)
Execute the non-destructive production health probe:
```bash
curl -f https://api.floxa.work/health/live
curl -f https://api.floxa.work/health/ready
```
Verify that `status === 'ready'` and `database.status === 'connected'`.

