# FLOXA WORK — PHASE 19 VERCEL FRONTEND DEPLOYMENT GUIDE

**Target Platform:** Vercel (Edge Network / Next.js Serverless Runtime)  
**Framework:** Next.js 16.2.10 (Turbopack Engine)  
**Production Hostname:** `app.floxa.work` (or temporary `*.vercel.app`)  
**Node Version:** Node.js 20.x  

---

## 1. Vercel Project Configuration

### 1.1 Project Settings
In the Vercel dashboard:
- **Project Name:** `floxa-work-frontend`
- **Framework Preset:** `Next.js`
- **Root Directory:** `floxa work/frontend` (or `frontend` if deploying from dedicated repo)
- **Build Command:** `next build` (or `npm run build`)
- **Output Directory:** `.next`
- **Install Command:** `npm install`

---

## 2. Production Environment Variables (Vercel Dashboard)

Set the following variables in the Vercel Project Settings > Environment Variables pane (apply to Production, Preview, and Development):

| Variable Name | Required | Target Value | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Yes | `https://api.floxa.work/api` | Public HTTPS REST API endpoint. |
| `NEXT_PUBLIC_WS_URL` | Yes | `wss://api.floxa.work/ws` | Public WSS WebSocket endpoint. |
| `NODE_ENV` | Auto | `production` | Set automatically by Vercel. |

> [!IMPORTANT]
> **Zero Localhost Fallback Defense:**  
> In Phase 19, `frontend/lib/api.ts` and `frontend/app/page.tsx` were hardened. If `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_WS_URL` are missing in a production browser environment, the frontend logs a critical warning and falls back to relative domain paths (`/api` and `wss://<host>/ws`) instead of silently leaking requests to `localhost:5001`.

---

## 3. Deployment Build Verification

Local Turbopack build drill confirmation:
```bash
cd "floxa work/frontend"
npm run build
```
- **Compilation Time:** 2.4 seconds (Turbopack)
- **TypeScript Typecheck:** 4.2 seconds (0 errors)
- **Route Generation:** Static prerendering (`/` and `/_not-found`) completed with zero warnings.

---

## 4. Subsystem Status

- **Build Configuration & Optimizations:** `LIVE VERIFIED` (Local Daemon) / `IMPLEMENTED`
- **Vercel Remote Deployment:** `CONFIGURED (Awaiting Operator Vercel Project Linking)`
