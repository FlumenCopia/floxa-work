# FLOXA Work — Early-Stage Deployment Guide

**Target Audience:** DevOps Engineers, Full-Stack Developers, Founding Team  
**Estimated Monthly Cost:** $0 – $25 / month  
**Hosting Topology:** Managed Frontend + Managed Backend Process + Shared MongoDB Atlas Cluster  
**Date:** 14 November 2026  

---

## 1. Recommended Hosting Platforms

For an early-stage launch with low traffic, the following lean platforms provide zero-maintenance deployment with automated SSL/TLS, continuous deployment from Git, and automatic health monitoring:

| Component | Recommended Platform | Plan | Estimated Cost |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | **Vercel** or **Netlify** | Hobby / Starter | $0 / month |
| **Backend API** | **Render** or **Railway** or **Fly.io** | Starter Web Service (512MB–1GB RAM) | $5 – $10 / month |
| **Database** | **MongoDB Atlas** | M0 (Free 512MB) or M2 Shared ($9/mo) | $0 – $9 / month |
| **Private Files** | **Local Disk Vault** or **Cloudflare R2** | Free Tier (10GB storage, $0 egress) | $0 / month |
| **Email Service** | **Resend** or **SendGrid** | Free Tier (100–3,000 emails/month) | $0 / month |
| **Total Cost** | | | **$5 – $19 / month** |

---

## 2. Step-by-Step Setup Guide

### Step 1: Provision MongoDB Atlas Cluster
1. Create a free M0 or shared M2 replica set on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. In Network Access, allowlist the backend hosting IP address (or `0.0.0.0/0` with strong password authentication).
3. Copy the connection URI:
   ```text
   mongodb+srv://floxa_admin:<PASSWORD>@cluster0.abcde.mongodb.net/floxa_work_prod?retryWrites=true&w=majority
   ```

### Step 2: Deploy Backend (e.g. Render / Railway)
1. Link your GitHub repository and set the root directory to `backend`.
2. **Build Command:** `npm run build`
3. **Start Command:** `npm run start`
4. Set the following Environment Variables in the hosting dashboard:
   ```bash
   NODE_ENV=production
   PORT=5001
   TRUST_PROXY=1
   DATABASE_URL=mongodb+srv://floxa_admin:<PASSWORD>@cluster0.abcde.mongodb.net/floxa_work_prod?retryWrites=true&w=majority
   JWT_ACCESS_SECRET=<generate-random-string-at-least-32-chars>
   JWT_REFRESH_SECRET=<generate-random-string-at-least-32-chars>
   CORS_ORIGIN=https://floxa.work
   STORAGE_PROVIDER=local
   EMAIL_PROVIDER=log
   ```
5. Configure Health Check Path: `/health/ready`

### Step 3: Deploy Frontend (e.g. Vercel)
1. Link your GitHub repository and set the root directory to `frontend`.
2. **Framework Preset:** Next.js
3. **Build Command:** `npm run build`
4. Set Environment Variables:
   ```bash
   NEXT_PUBLIC_API_URL=https://api.floxa.work/api
   NEXT_PUBLIC_WS_URL=wss://api.floxa.work/ws
   ```
5. Deploy. Vercel will build and assign an SSL certificate automatically.

### Step 4: Verification Smoke Test
Once both services are deployed, test public connectivity:
```bash
curl -f https://api.floxa.work/health/live
curl -f https://api.floxa.work/health/ready
```
Verify that `status === 'ready'` and `database.status === 'connected'`.
