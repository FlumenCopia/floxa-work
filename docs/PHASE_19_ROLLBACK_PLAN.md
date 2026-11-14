# FLOXA WORK — PHASE 19 PRODUCTION ROLLBACK PLAN

**Document Version:** 1.0.0  
**Target Environments:** Vercel (Frontend), Railway (Backend), MongoDB Atlas (Database)  
**Emergency Objective:** Restore system to last known healthy state within < 5 minutes  

---

## 1. Rollback Matrix & Decision Thresholds

| Trigger Condition | Primary Action | Target Rollback Version | Estimated MTTR |
| :--- | :--- | :--- | :--- |
| **Frontend Fatal Bug / Blank Screen** | Vercel Instant Rollback | Previous Instant Deployment Snapshot | < 30 seconds |
| **Backend API Crash Loop / Regressions** | Railway Deployment Revert | Previous Successful Build | < 2 minutes |
| **Corrupted Database Schema / Data Loss** | Atlas Snapshot Restore | Point-in-Time Snapshot prior to incident | < 15 minutes |
| **Severe Platform Security Incident** | Git Revert & Secret Rotation | Checkpoint `3de5f99` + New Secrets | < 5 minutes |

---

## 2. Platform-Specific Rollback Procedures

### 2.1 Vercel Frontend Instant Rollback
Vercel maintains immutable build artifacts for every commit:
1. Open [vercel.com](https://vercel.com) dashboard.
2. Navigate to project: `floxa-work-frontend` > **Deployments**.
3. Identify the last known healthy deployment (e.g., matching checkpoint `3de5f99` or previous successful tag).
4. Click the three dots `...` on the healthy deployment card > select **Instant Rollback**.
5. Traffic is shifted immediately at the edge without recompiling or rebuilding.

---

### 2.2 Railway Backend Container Revert
Railway retains container image builds:
1. Open [railway.app](https://railway.app) dashboard.
2. Navigate to `floxa-work-backend` > **Deployments**.
3. Locate the previous successful deployment marked `ACTIVE` prior to the incident.
4. Click **Redeploy** on that deployment.
5. Railway boots the pre-built container image and switches incoming HTTP/WSS traffic once `/health/live` passes.

---

### 2.3 MongoDB Atlas Point-in-Time Recovery
If corrupted data was written:
1. Open MongoDB Atlas dashboard > Cluster Overview > **Backup**.
2. Select **Restore**.
3. Choose **Point in Time (PITR)** or select the snapshot taken before the deployment window.
4. Select **Restore to a New Cluster** or temporary test database to inspect recovered documents.
5. Update `MONGODB_URI` in Railway to point to the restored database.

---

### 2.4 Git Checkpoint Restoration
If code must be reverted in source control:
```bash
# Check status and verify commit history
git log -n 5 --oneline

# Safe revert of deployment commit
git revert --no-edit HEAD

# Rebuild and test before redeploying
cd backend && npm run build && npm test
cd ../frontend && npm run build
```
