# FLOXA WORK — PHASE 20 OPERATOR PROVISIONING GUIDE

**Guide Version:** 1.0.0 (Production Beta Provisioning)  
**Target Audience:** Human Platform Operator / Systems Administrator  
**Security Notice:** Never paste production passwords, API keys, private keys, database connection strings, or JWT secrets into chat, issues, or source code. Enter all secrets directly into the relevant provider dashboards or secure secret managers.

---

## 1. Overview of Cloud Architecture & Services

To take FLOXA Work live for controlled beta users, the operator provisions and links six services:

```mermaid
flowchart TD
    subgraph FrontendPlatform ["Frontend Hosting (Vercel)"]
        VercelApp["Next.js 16.2 Turbopack\n(app.floxa.work)"]
    end

    subgraph BackendPlatform ["Backend & WebSockets (Railway)"]
        RailwayApp["Express API + WebSockets\n(api.floxa.work)\nSingle Container (1 vCPU, 1 GB)"]
    end

    subgraph DatabasePlatform ["Database (MongoDB Atlas)"]
        AtlasCluster["MongoDB 7.0+ Cluster\nTLS 1.3, SCRAM-SHA-256\nfloxa_work_prod"]
    end

    subgraph StoragePlatform ["Private Object Storage (Cloudflare R2)"]
        R2Bucket["Private S3-Compatible Bucket\nfloxa-work-private-vault"]
    end

    subgraph EmailPlatform ["Transactional Email (Resend)"]
        ResendService["Resend API\nmail.floxa.work"]
    end

    subgraph DNSPlatform ["DNS & Edge SSL (Cloudflare / Registrar)"]
        DNSRecords["app.floxa.work -> Vercel\napi.floxa.work -> Railway\nmail.floxa.work -> Resend"]
    end

    VercelApp -->|HTTPS API & WSS| RailwayApp
    RailwayApp -->|TLS| AtlasCluster
    RailwayApp -->|S3 API| R2Bucket
    RailwayApp -->|REST API| ResendService
    DNSRecords -.-> VercelApp
    DNSRecords -.-> RailwayApp
    DNSRecords -.-> ResendService
```

---

## 2. Service 1: MongoDB Atlas (Production Database)

### 2.1 Account Creation & Plan Selection
1. Navigate to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up or log in.
2. Create an Organization: `Floxa Work`.
3. Create a Project: `floxa-work-production`.
4. Deploy a Database:
   - **Plan:** M0 Free Shared (Evaluation) or M10 Dedicated (Recommended for Production Beta with automated daily snapshots).
   - **Cloud Provider & Region:** AWS or GCP in your target geography (e.g., `us-east-1` or `ap-south-1`).
   - **Cluster Name:** `floxa-work-cluster`.

### 2.2 Security & Access Configuration
1. **Database Access (User Creation):**
   - Click **Database Access** > **Add New Database User**.
   - **Authentication Method:** Password (SCRAM-SHA-256).
   - **Username:** `floxa_work_app_user`.
   - **Password:** Autogenerate a secure 32+ character alphanumeric string (store in a password manager).
   - **Database User Privileges:** Select **Built-in Role** > `Read and write to any database` or restrict specifically to `readWrite` on database `floxa_work_prod`.
   - Click **Add User**.
2. **Network Access (IP Allowlist):**
   - Click **Network Access** > **Add IP Address**.
   - **Initial Setup:** If deploying to Railway with dynamic outbound IP, temporarily add your development IP or Railway outbound IP range.
   - **Production Standard:** Restrict access to Railway static egress IPs or VPC peering. Avoid permanent `0.0.0.0/0`.
3. **Obtain Connection String:**
   - In Database Deployments, click **Connect** > **Drivers** (Node.js).
   - Copy the SRV string format:
     `mongodb+srv://floxa_work_app_user:<password>@floxa-work-cluster.mongodb.net/floxa_work_prod?retryWrites=true&w=majority&appName=FloxaWorkProd`

### 2.3 Environment Variable
- `MONGODB_URI`: The connection string above. Enter directly in Railway dashboard variables.

### 2.4 How to Verify
- The backend readiness probe (`GET /health/ready`) will return `"database": { "status": "connected", "pingMs": <number> }`.

### 2.5 How to Undo / Disable
- In Atlas: Pause cluster, delete user `floxa_work_app_user`, or revoke network access rules.

---

## 3. Service 2: Railway (Backend API & WebSocket Hosting)

### 3.1 Account Creation & Plan Selection
1. Navigate to [railway.app](https://railway.app) and sign up with GitHub.
2. Select the **Hobby Plan** ($5/mo credits) or **Pro Plan**.

### 3.2 Service Deployment
1. Click **New Project** > **Deploy from GitHub repo** > select repository `floxa-work`.
2. Select service settings:
   - **Root Directory:** `floxa work/backend` (or `backend` if standalone).
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run start`
   - **Instance Sizing:** 1 vCPU, 1 GB RAM (Single Instance Beta).
   - **Replicas:** Exactly 1 (to maintain in-process WebSocket connection state).

### 3.3 Secure Environment Variables (Railway Dashboard)
Navigate to **Variables** tab and add:

| Key | Value / Guidance |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | (Auto-injected by Railway; do not hardcode) |
| `MONGODB_URI` | `mongodb+srv://floxa_work_app_user:...@.../floxa_work_prod?...` |
| `JWT_ACCESS_SECRET` | Generate random 64-char hex string (e.g. `openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | Generate random 64-char hex string (different from access secret) |
| `CORS_ORIGIN` | `https://app.floxa.work` (or temporary Vercel URL) |
| `TRUST_PROXY` | `true` |
| `STORAGE_PROVIDER` | `local` (or `r2` if Cloudflare R2 is configured) |
| `EMAIL_PROVIDER` | `log` (or `resend` if Resend is configured) |

### 3.4 How to Verify
- In Railway settings, click **Generate Domain** to get a public URL (e.g. `https://floxa-work-production.up.railway.app`).
- Visit `https://<railway-domain>/health/live`. Expected response: `{"status":"ok"}`.
- Visit `https://<railway-domain>/health/ready`. Expected response: `{"status":"ready"}`.

### 3.5 How to Undo / Disable
- In Railway project settings, click **Delete Service** or toggle **Settings > General > Pause**.

---

## 4. Service 3: Vercel (Frontend Hosting)

### 4.1 Account Creation & Plan Selection
1. Navigate to [vercel.com](https://vercel.com) and sign up with GitHub.
2. The **Hobby Plan** (Free) is sufficient for initial beta users.

### 4.2 Project Import & Configuration
1. Click **Add New...** > **Project** > Import the `floxa-work` repository.
2. Configure project settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `floxa work/frontend` (or `frontend` if standalone).
   - **Build Command:** `next build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

### 4.3 Secure Environment Variables (Vercel Dashboard)
Add in **Settings > Environment Variables** (apply to Production, Preview, Development):

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://api.floxa.work/api` (or `https://<railway-domain>/api`) |
| `NEXT_PUBLIC_WS_URL` | `wss://api.floxa.work/ws` (or `wss://<railway-domain>/ws`) |

### 4.4 How to Verify
- Click **Deploy**. Vercel will build with Turbopack in ~30 seconds.
- Visit the generated Vercel deployment URL (e.g., `https://floxa-work-beta.vercel.app`).
- Open Developer Tools (`F12`). Confirm zero console errors and successful API handshake.

### 4.5 How to Undo / Disable
- In Vercel Project Settings > Advanced, click **Delete Project**.

---

## 5. Service 4: Cloudflare R2 (Private File Storage)

### 5.1 Account Creation & Bucket Setup
1. Navigate to [cloudflare.com](https://www.cloudflare.com) and log in.
2. Click **R2** from the side navigation.
3. Click **Create bucket**:
   - **Bucket name:** `floxa-work-private-vault`.
   - **Location:** Automatic (or choose your region).
   - **Default Storage Class:** Standard.
4. **Public Access:** Ensure **Public bucket access is Disabled** (do not connect custom domains or allow public URL access).

### 5.2 API Token Generation
1. In R2 overview, click **Manage R2 API Tokens** > **Create API Token**.
2. **Permissions:** Object Read & Write.
3. **Bucket Scope:** Restrict to `floxa-work-private-vault`.
4. Copy the **Access Key ID**, **Secret Access Key**, and **Endpoint URL** (`https://<account_id>.r2.cloudflarestorage.com`).

### 5.3 Configure in Railway Backend
Add to Railway Environment Variables:
```bash
STORAGE_PROVIDER="r2"
CLOUDFLARE_R2_ACCOUNT_ID="<your-account-id>"
CLOUDFLARE_R2_ACCESS_KEY_ID="<your-access-key-id>"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="<your-secret-access-key>"
CLOUDFLARE_R2_BUCKET_NAME="floxa-work-private-vault"
CLOUDFLARE_R2_ENDPOINT="https://<account_id>.r2.cloudflarestorage.com"
```

### 5.4 How to Verify
- Call `https://api.floxa.work/health/ready`.
- Confirm response: `"storage": { "provider": "r2", "status": "online" }`.

### 5.5 How to Undo / Fallback
- Change `STORAGE_PROVIDER="local"` in Railway variables and redeploy to fall back immediately to local vault.

---

## 6. Service 5: Resend (Transactional Email)

### 6.1 Account Creation & Domain Verification
1. Navigate to [resend.com](https://resend.com) and create an account.
2. Click **Domains** > **Add Domain**: enter `mail.floxa.work` (or `floxa.work`).
3. Add the displayed DNS records (DKIM TXT, SPF TXT, MX) to your DNS manager.
4. Click **Verify DNS**. Status will change to **Verified** once records propagate.

### 6.2 API Key Generation
1. In Resend, click **API Keys** > **Create API Key**.
2. **Name:** `floxa-work-production-backend`.
3. **Permission:** Sending access only.
4. Copy the API key (`re_...`).

### 6.3 Configure in Railway Backend
Add to Railway Environment Variables:
```bash
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_..."
EMAIL_FROM="FLOXA Work <noreply@mail.floxa.work>"
```

### 6.4 How to Verify
- Register a test user. Confirm transactional verification email arrives in your inbox.

### 6.5 How to Undo / Fallback
- Change `EMAIL_PROVIDER="log"` in Railway to route emails safely to container stdout logs without sending.

---

## 7. Service 6: Domain Registrar & DNS Configuration

### 7.1 DNS Records to Create

| Subdomain | Record Type | Target / Value | TTL | Proxy Status |
| :--- | :--- | :--- | :--- | :--- |
| `app.floxa.work` | **CNAME** | `cname.vercel-dns.com` | Auto | DNS Only (or Proxied) |
| `api.floxa.work` | **CNAME** | `<railway-service>.up.railway.app` | Auto | DNS Only (or Proxied) |
| `resend._domainkey.mail` | **TXT** | (From Resend Dashboard) | Auto | DNS Only |
| `mail` | **TXT** | `v=spf1 include:amazonses.com ~all` | Auto | DNS Only |
| `mail` | **MX** | `feedback-smtp.us-east-1.amazonses.com` (Priority 10) | Auto | DNS Only |

### 7.2 Custom Domain Linking in Dashboards
1. **Vercel:** Go to `floxa-work-frontend` > Settings > **Domains** > Add `app.floxa.work`. Vercel issues SSL automatically.
2. **Railway:** Go to `floxa-work-backend` > Settings > **Custom Domains** > Add `api.floxa.work`. Railway issues SSL automatically.
3. Update `CORS_ORIGIN="https://app.floxa.work"` in Railway.

---

## 8. Summary Checklist for Operator

- [ ] 1. MongoDB Atlas cluster deployed; user `floxa_work_app_user` created.
- [ ] 2. Railway backend service connected to repo; environment variables configured.
- [ ] 3. Vercel frontend service connected to repo; API & WS URLs configured.
- [ ] 4. (Optional) Cloudflare R2 bucket created and keys injected into Railway.
- [ ] 5. (Optional) Resend domain verified and API key injected into Railway.
- [ ] 6. DNS CNAME records configured for `app.floxa.work` and `api.floxa.work`.
- [ ] 7. End-to-end user registration and brief posting tested on live URLs.
