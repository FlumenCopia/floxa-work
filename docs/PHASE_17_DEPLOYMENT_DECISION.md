# FLOXA WORK — PHASE 17: DEPLOYMENT DECISION & ARCHITECTURE PLAN

**Audience:** Platform Operators & Product Leads  
**Target:** Affordable, High-Reliability Early Beta Deployment  
**Constraint:** Keep existing architecture (Next.js frontend + Express/TypeScript backend + MongoDB + WebSockets + Private Storage). No Kubernetes, no microservices, no premature scaling.  

---

## 1. Hosting Provider Comparative Analysis

| Component | Option A (Recommended) | Option B | Option C | Key Trade-offs & Limitations |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** ($0 – $20/mo) | **Netlify** ($0 – $19/mo) | **Render Static / Node** ($7/mo) | Vercel provides native Next.js 16 / Turbopack support, automatic edge caching, global CDN, zero SSR configuration. Free tier covers early beta; Pro ($20/mo) adds team audit logs. |
| **Backend API & WebSockets** | **Railway** ($5 – $10/mo) | **Render Web Service** ($7/mo) | **DigitalOcean Droplet** ($6/mo) | **Railway** supports persistent WebSockets with zero timeout drops, automatic zero-config Dockerfile/Node detection, and volume attachments. Render free tier spins down after 15m inactivity and breaks persistent WebSockets on sleep. |
| **Managed Database** | **MongoDB Atlas** (M0 Free → M2 $9/mo) | **Railway MongoDB** ($5/mo) | **DigitalOcean Managed DB** ($15/mo) | **MongoDB Atlas M0** provides 512MB free tier with automated TLS, daily snapshots, and IP allowlisting. M2 tier ($9/mo) provides dedicated RAM and continuous backup snapshots for beta launch. |
| **Private File Storage** | **Cloudflare R2** ($0/mo up to 10GB) | **Railway Volume** ($0.25/GB) | **AWS S3** ($1 – $3/mo) | **Cloudflare R2** has zero egress fees, S3 API compatibility (works with existing `env.ts` S3 driver), and 10GB free tier. Railway persistent disk is simple but local to one container. |

---

## 2. Recommended Initial Production Architecture

```
[ Clients & Freelancers (Mobile & Desktop) ]
                     │
         HTTPS / WSS │
                     ▼
  ┌─────────────────────────────────────┐
  │         Cloudflare DNS / SSL        │
  │    (app.floxa.work / api.floxa.work)│
  └──────────────────┬──────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
┌──────────────────┐   ┌────────────────────────────────┐
│  Vercel Frontend │   │   Railway Backend Container   │
│  (Next.js 16)    │   │   (Express + WebSockets)       │
│  app.floxa.work  │   │   api.floxa.work               │
└──────────────────┘   └────────┬──────────────┬────────┘
                                │              │
                    Private API │              │ S3 Compatible
                                ▼              ▼
                     ┌──────────────────┐ ┌──────────────────┐
                     │  MongoDB Atlas   │ │  Cloudflare R2   │
                     │  (M0 / M2 Tier)  │ │  Private Vault   │
                     └──────────────────┘ └──────────────────┘
```

---

## 3. Estimated Monthly Operating Costs

| Service | Tier / Plan | Monthly Cost (USD) | Scaling Threshold |
| :--- | :--- | :---: | :--- |
| **Vercel Frontend** | Hobby Tier (Free) | **$0.00** | Up to 100 GB bandwidth / 100k requests/day |
| **Railway Backend** | Hobby Plan (Usage-based) | **$5.00 – $8.00** | Covers 512MB–1GB RAM and 24/7 WebSocket daemon |
| **MongoDB Atlas** | M0 Shared (Free) | **$0.00** | 512MB data storage (sufficient for ~5,000 users/briefs) |
| **Cloudflare R2** | Free Tier (10 GB) | **$0.00** | Zero egress fees; $0.015/GB above 10GB |
| **Resend (Email)** | Free Tier (3,000 emails/mo) | **$0.00** | 100 emails/day (sufficient for early beta) |
| **Domain & DNS** | Existing domain | **$0.00** | DNS managed via Cloudflare Free |
| **TOTAL INITIAL ESTIMATE** | **Affordable Beta Budget** | **$5.00 – $8.00 / month** | **Under $10/month total infrastructure cost** |

---

## 4. Technical Requirements & Considerations

### 4.1 WebSocket Requirements
- Node.js WebSocket server (`src/websocket/socketServer.ts`) requires persistent TCP connections for live chat and collaboration events.
- **Why Railway over Serverless:** AWS Lambda or Vercel serverless functions terminate after 15–30 seconds and cannot maintain persistent stateful WebSockets without external third-party subscriptions (like Pusher or Ably). Railway runs a continuous Node.js process supporting thousands of concurrent WebSockets natively.

### 4.2 Persistent Storage & Deliverable Isolation
- Deliverable bundles and portfolio attachments require isolation.
- Cloudflare R2 is configured using the S3 abstraction already built into `backend/src/config/env.ts`.
- Files remain strictly private: downloads require pre-signed URLs or authorized streaming through `/api/files/:fileName/download`.

### 4.3 Database Backup Strategy
1. **Automated Cloud Provider Snapshots:** MongoDB Atlas daily point-in-time snapshots.
2. **Deterministic Script Backups:** Run `node backend/scripts/backup-database.cjs` via scheduled cron or GitHub Action. Output archives are compressed and validated with SHA-256 checksums.
