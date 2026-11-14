# FLOXA Work — Staging Deployment Guide

**Environment:** Staging / Pre-Production Validation  
**Target Domain:** `staging.floxa.work` & `api-staging.floxa.work`  
**Purpose:** End-to-end user journey validation, load testing, and release dress rehearsals.  
**Date:** 14 November 2026  

---

## 1. Prerequisites & Environment Setup

1. **Staging Database:** Dedicated isolated MongoDB replica set (never share cluster with production).
2. **Environment File Configuration (`.env.staging`):**
   ```bash
   NODE_ENV=staging
   PORT=5001
   TRUST_PROXY=1
   DATABASE_URL=mongodb+srv://staging_user:<pass>@staging-cluster.mongodb.net/floxa_work_staging
   JWT_ACCESS_SECRET=<staging-secret-min-32-chars>
   JWT_REFRESH_SECRET=<staging-refresh-secret-min-32-chars>
   CORS_ORIGIN=https://staging.floxa.work
   STORAGE_PROVIDER=local
   EMAIL_PROVIDER=log
   ```

---

## 2. Step-by-Step Deployment Procedure

### Step 1: Clone and Verify Integrity
```bash
git checkout master
npm ci --prefix backend
npm ci --prefix frontend
```

### Step 2: Build Artifacts
```bash
cd backend && npm run build
cd ../frontend && npm run build
```

### Step 3: Run Database Migrations & Index Synchronization
```bash
cd backend
node -e "require('./dist/config/indexManager.js').syncAndVerifyDatabaseIndexes().then(console.log)"
```

### Step 4: Start Daemon Services (PM2 or Systemd)
```bash
pm2 start dist/server.js --name "floxa-backend-staging"
cd ../frontend && pm2 start "npm run start -- -p 3001" --name "floxa-frontend-staging"
```

### Step 5: Verify Health Probes
```bash
curl -f http://localhost:5001/health/live
curl -f http://localhost:5001/health/ready
```

