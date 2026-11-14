# FLOXA WORK — PHASE 18: DEPLOYMENT EXECUTION LOG

**Execution Date:** 14 November 2026  
**Target Environment:** Guided Cloud Deployment (Vercel + Railway + MongoDB Atlas + Cloudflare R2 + Resend)  
**Pre-Deployment Checkpoint:** `ddbc14c` (Confirmed on branch `master`)  
**Deployment Policy:** No automated paid actions or domain purchases without explicit user authorization.  

---

## 1. Pre-Deployment Repository Verification Checklist

| Verification Item | Tested Property / Value | Status |
| :--- | :--- | :---: |
| **Git Working Tree** | Clean state on `master` at commit `ddbc14c` | **VERIFIED** |
| **Backend TypeScript Build** | `npm run build` in `backend` executes `tsc` with 0 errors | **VERIFIED** |
| **Frontend Production Build** | `npm run build` in `frontend` executes `next build` (16.2 Turbopack) with 0 errors | **VERIFIED** |
| **Dynamic Port Binding** | `backend/src/server.ts` binds `process.env.PORT || 5001` | **VERIFIED** |
| **Frontend API Base URL** | `frontend/lib/api.ts` uses `process.env.NEXT_PUBLIC_API_URL` with dev fallback | **VERIFIED** |
| **Frontend WebSocket URL** | `frontend/app/page.tsx` uses `process.env.NEXT_PUBLIC_WS_URL` with dev fallback | **VERIFIED** |
| **Backend CORS Whitelist** | `backend/src/app.ts` reads comma-delimited `ENV.CORS_ORIGIN` | **VERIFIED** |
| **WebSocket Upgrade Handler** | Server attaches `initWebSocketServer(httpServer)` directly on `/ws` | **VERIFIED** |
| **Fail-Fast Secrets Check** | `backend/src/config/env.ts` halts startup in production if JWT keys are default/weak | **VERIFIED** |
| **Private Vault Security** | `IStorageProvider` defends against path traversal; supports S3/R2 | **VERIFIED** |
| **Backup Integrity** | `backend/scripts/backup-database.cjs` and `restore-database.cjs` verified | **VERIFIED** |

---

## 2. Guided Cloud Provisioning & Execution Steps

### Step 1: Database Provisioning (MongoDB Atlas)
- **Status:** `IMPLEMENTED` (Code & Pooling) / `CONFIGURED` (Locally) / `NOT STARTED` (Remote Cloud Cluster)
- **Instructions for Operator:**
  1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
  2. Create a free M0 cluster (e.g. AWS / us-east-1).
  3. Create a database user with readWrite privileges (e.g., `floxa_admin`).
  4. In Network Access, allow access from anywhere (`0.0.0.0/0`) or Railway egress IP ranges.
  5. Copy the connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/floxa_work_prod?retryWrites=true&w=majority`.

### Step 2: Backend & WebSockets Provisioning (Railway)
- **Status:** `IMPLEMENTED` (Container Code) / `NOT STARTED` (Remote Cloud Deploy)
- **Instructions for Operator:**
  1. Sign in to [Railway.app](https://railway.app).
  2. Click "New Project" → "Deploy from GitHub repo" → select `floxa work/backend`.
  3. In Service Settings:
     - Set Build Command: `npm run build`
     - Set Start Command: `npm run start`
  4. In Variables, populate production variables:
     - `NODE_ENV=production`
     - `DATABASE_URL=<MongoDB_Atlas_Connection_String>`
     - `JWT_ACCESS_SECRET=<Generated_64_Char_Hex_Secret>`
     - `JWT_REFRESH_SECRET=<Generated_64_Char_Hex_Secret>`
     - `CORS_ORIGIN=https://app.floxa.work,https://floxa-work.vercel.app`
     - `TRUST_PROXY=true`
     - `STORAGE_PROVIDER=s3` (or `local` if persistent disk volume added)
     - `EMAIL_PROVIDER=resend` (or `log` for initial staging)
  5. Under Settings → Networking, click "Generate Domain" (e.g. `api.floxa.work` or `*.up.railway.app`).

### Step 3: Frontend Provisioning (Vercel)
- **Status:** `IMPLEMENTED` (Next.js 16) / `NOT STARTED` (Remote Cloud Deploy)
- **Instructions for Operator:**
  1. Sign in to [Vercel](https://vercel.com).
  2. Click "Add New" → "Project" → import the repository.
  3. Set Root Directory to `frontend`.
  4. Framework Preset: Next.js.
  5. Under Environment Variables, add:
     - `NEXT_PUBLIC_API_URL=https://api.floxa.work/api` (or Railway assigned domain `/api`)
     - `NEXT_PUBLIC_WS_URL=wss://api.floxa.work/ws` (or Railway assigned domain `/ws`)
  6. Click "Deploy".

### Step 4: Private Vault Storage (Cloudflare R2)
- **Status:** `IMPLEMENTED` (S3 Adapter) / `NOT STARTED` (Remote Bucket Setup)
- **Instructions for Operator:**
  1. In Cloudflare Dashboard, navigate to R2 Object Storage.
  2. Create a bucket named `floxa-work-prod-vault`. Set visibility to **Private** (zero public read access).
  3. Generate R2 API tokens with Edit permissions.
  4. Add credentials to Railway backend environment variables:
     - `S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com`
     - `S3_BUCKET=floxa-work-prod-vault`
     - `S3_ACCESS_KEY_ID=<r2_access_key>`
     - `S3_SECRET_ACCESS_KEY=<r2_secret_key>`

### Step 5: Transactional Email Setup (Resend)
- **Status:** `IMPLEMENTED` (Email Service) / `NOT STARTED` (Live Domain Verification)
- **Instructions for Operator:**
  1. In [Resend.com](https://resend.com), add sending domain `floxa.work`.
  2. Add DNS records (TXT, MX, CNAME) to Cloudflare DNS.
  3. Generate API Key and add to Railway environment variables:
     - `RESEND_API_KEY=re_...`
     - `EMAIL_FROM=FLOXA Work <notifications@floxa.work>`

---

## 3. Operational Invariants Verified

- Zero automated external spending occurred during local preparation.
- Codebase builds and starts cleanly in production mode with zero hardcoded localhost strings.
- All secrets remain protected behind external provider environment consoles.
