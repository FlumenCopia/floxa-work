# FLOXA WORK — PHASE 17 PRODUCTION ENVIRONMENT CONFIGURATION CHECKLIST

**Security Rule:** Never commit real secrets to source control. Never prefix sensitive secrets with `NEXT_PUBLIC_` in the frontend.  
**Audience:** System Administrators & DevOps Engineers provisioning production environments.  

---

## 1. Backend Environment Variables (`.env.production`)

Provision these variables in the hosting provider dashboard (e.g. Railway / Render / VPS):

| Variable Name | Required | Recommended Format / Description | Security Notes |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **YES** | `production` | Enables fail-fast checks, disables verbose dev logs |
| `PORT` | **YES** | `5001` (or provider `$PORT`) | Port for HTTP & WebSocket listeners |
| `DATABASE_URL` | **YES** | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/floxa_work_prod?retryWrites=true&w=majority` | Production MongoDB Atlas connection string |
| `DB_MAX_POOL_SIZE` | NO | `25` | Prevents connection exhaustion on Atlas M0/M2 |
| `JWT_ACCESS_SECRET` | **YES** | `openssl rand -hex 32` (Min 64 hex characters) | Cryptographic signature for 15-minute access tokens |
| `JWT_REFRESH_SECRET` | **YES** | `openssl rand -hex 32` (Min 64 hex characters) | Cryptographic signature for 7-day refresh tokens |
| `JWT_ACCESS_EXPIRY` | NO | `15m` | Short-lived access token window |
| `JWT_REFRESH_EXPIRY` | NO | `7d` | Refresh token lifecycle window |
| `CORS_ORIGIN` | **YES** | `https://app.floxa.work` (or custom frontend domain) | Whitelist production domain; reject arbitrary origins |
| `TRUST_PROXY` | **YES** | `true` | Required when running behind Vercel/Cloudflare reverse proxy |
| `STORAGE_PROVIDER` | **YES** | `s3` (or `local` if persistent volume attached) | Enables Cloudflare R2 / AWS S3 cloud vault |
| `S3_ENDPOINT` | COND | `https://<account-id>.r2.cloudflarestorage.com` | Cloudflare R2 / S3 API endpoint |
| `S3_BUCKET` | COND | `floxa-work-prod-vault` | Bucket name |
| `S3_ACCESS_KEY_ID` | COND | Generated access key | Read/write credentials |
| `S3_SECRET_ACCESS_KEY`| COND | Generated secret key | Sensitive secret |
| `EMAIL_PROVIDER` | **YES** | `resend` (or `sendgrid` / `smtp`) | Transactional email provider |
| `EMAIL_FROM` | **YES** | `FLOXA Work <notifications@floxa.work>` | Verified domain sender address |
| `RESEND_API_KEY` | COND | `re_...` | API key from Resend dashboard |
| `RATE_LIMIT_MAX_REQUESTS`| NO | `1000` (per 15-minute window) | DDoS mitigation |

---

## 2. Frontend Environment Variables (`frontend/.env.production`)

Only public non-sensitive configuration should be exposed to the browser client:

| Variable Name | Required | Value / Format | Security Notes |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **YES** | `https://api.floxa.work/api` | Public backend REST API base URL |
| `NEXT_PUBLIC_WS_URL` | **YES** | `wss://api.floxa.work` | Public WebSocket endpoint for real-time sync |
| `NEXT_PUBLIC_APP_ENV` | NO | `production` | Client-side feature flags |

> [!CAUTION]
> **Zero Secrets in Frontend:** Never place database connection strings, JWT secret keys, cloud storage secrets, or payment credentials into `frontend/.env` or any file prefixed with `NEXT_PUBLIC_`. All client-side environment variables are visible in browser JavaScript bundles.

---

## 3. Secret Generation Helper Commands

Generate cryptographically secure production keys on any terminal:

```bash
# Generate JWT Access Secret
openssl rand -hex 32

# Generate JWT Refresh Secret
openssl rand -hex 32
```
