# FLOXA WORK — PHASE 19 RAILWAY BACKEND DEPLOYMENT GUIDE

**Target Environment:** Railway.app (Node.js 20 LTS Runtime)  
**Service Name:** `floxa-work-backend`  
**Public Hostname:** `api.floxa.work` (or temporary `*.up.railway.app`)  
**Instance Sizing:** 1 vCPU, 1 GB RAM (Single Instance Beta)  

---

## 1. Railway Service Configuration

### 1.1 Root Directory & Build Settings
In the Railway service settings:
- **Root Directory:** `floxa work/backend` (or `backend` if deploying from dedicated repo)
- **Build Command:** `npm run build` (runs `tsc` producing `dist/`)
- **Start Command:** `npm run start` (runs `node dist/server.js`)
- **Restart Policy:** `ON_FAILURE` (max 5 retries with exponential backoff)

### 1.2 Dynamic Port Binding
The backend's `server.ts` dynamically binds to `process.env.PORT`:
```typescript
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`[FLOXA Work Backend] Server listening at http://localhost:${PORT}`);
});
```
Railway dynamically injects `$PORT` (typically `PORT=8080` or random port). The server respects this without hardcoding.

---

## 2. Production Environment Variables (Railway Dashboard)

Set the following environment variables in the Railway Service Variables pane:

| Variable Name | Required | Sample Production Value | Purpose |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Enables production security, cookie hardening, and log sanitization. |
| `PORT` | Auto | (Injected by Railway) | Dynamic port listening. |
| `MONGODB_URI` | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/floxa_work_prod` | TLS connection to Atlas. |
| `JWT_ACCESS_SECRET` | Yes | `<64-char cryptographically random hex>` | Access token signing (15-min expiry). |
| `JWT_REFRESH_SECRET` | Yes | `<64-char cryptographically random hex>` | Refresh token signing (7-day rotation). |
| `CORS_ORIGIN` | Yes | `https://app.floxa.work` | Strict origin whitelist (no wildcards). |
| `TRUST_PROXY` | Yes | `true` | Tells Express to trust Railway's reverse proxy for `X-Forwarded-For`. |
| `STORAGE_PROVIDER` | Yes | `r2` (or `local` if unconfigured) | Private file vault provider. |
| `CLOUDFLARE_R2_ACCOUNT_ID` | Optional | `<cloudflare-account-id>` | Cloudflare R2 Account ID. |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Optional | `<r2-access-key-id>` | Cloudflare R2 Access Key ID. |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Optional | `<r2-secret-key>` | Cloudflare R2 Secret Access Key. |
| `CLOUDFLARE_R2_BUCKET_NAME` | Optional | `floxa-work-private-vault` | Cloudflare R2 Private Bucket. |
| `CLOUDFLARE_R2_ENDPOINT` | Optional | `https://<id>.r2.cloudflarestorage.com` | S3-compatible API endpoint. |
| `EMAIL_PROVIDER` | Yes | `resend` (or `log` for local mock) | Transactional email provider. |
| `RESEND_API_KEY` | Optional | `re_123456789...` | Resend API credential. |
| `EMAIL_FROM` | Yes | `FLOXA Work <noreply@mail.floxa.work>` | Verified sender address. |

---

## 3. Liveness, Readiness & Health Probes

Configure Railway HTTP Healthcheck:
- **Healthcheck Path:** `/health/live`
- **Readiness Path:** `/health/ready`
- **Healthcheck Timeout:** 5 seconds
- **Healthcheck Interval:** 15 seconds

### Expected Payloads:
- **`GET /health/live`:**
  ```json
  {
    "status": "ok",
    "service": "floxa-work-backend",
    "uptimeSeconds": 3023,
    "timestamp": "2026-11-14T10:50:01.134Z"
  }
  ```
- **`GET /health/ready`:**
  ```json
  {
    "status": "ready",
    "database": {
      "status": "connected",
      "pingMs": 2,
      "name": "floxa_work_prod"
    },
    "storage": {
      "provider": "r2",
      "status": "online"
    },
    "uptimeSeconds": 3023,
    "timestamp": "2026-11-14T10:50:01.134Z"
  }
  ```

---

## 4. Single-Instance Deployment & Scaling Policy

> [!IMPORTANT]
> **Single Instance Constraint for Controlled Beta:**  
> The FLOXA Work backend maintains real-time WebSocket connection state in memory (`socketServer.ts`).  
> In Phase 19, the Railway service must be deployed with **Replicas: 1**.  
> Horizontal autoscaling across multiple containers without a shared Redis Pub/Sub adapter would split WebSocket rooms across instances, preventing users from receiving real-time collaboration events.  
> A single 1 vCPU / 1 GB RAM container can comfortably sustain **500 concurrent connections**, exceeding initial beta requirements.

---

## 5. Subsystem Status

- **Build & Server Scripts:** `LIVE VERIFIED` (Local Daemon) / `IMPLEMENTED`
- **Dynamic Port & Health Probes:** `LIVE VERIFIED`
- **Railway Container Instance:** `CONFIGURED (Awaiting Operator Railway Project Linking)`
