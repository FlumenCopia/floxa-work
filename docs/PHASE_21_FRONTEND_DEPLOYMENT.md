# FLOXA WORK — PHASE 21 FRONTEND DEPLOYMENT GUIDE

**Framework:** Next.js 16.2.10 (Turbopack Engine)  
**Port Binding:** `127.0.0.1:3001` (Internal Loopback Only)  
**Process Manager:** systemd (`floxa-frontend.service`)  
**Deployment Path:** `/var/www/floxa-work/frontend`  

---

## 1. Build & Compilation Procedure on VPS

When logged in as user `floxa`:

```bash
cd /var/www/floxa-work/frontend

# 1. Install production dependencies
npm install

# 2. Build optimized Next.js production bundle with Turbopack
npm run build
# Creates optimized production SSR pages and static chunks in .next/
```

---

## 2. Environment Configuration

In `/etc/floxa/frontend.env`:
```ini
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://api.floxa.work/api
NEXT_PUBLIC_WS_URL=wss://api.floxa.work/ws
```

> [!IMPORTANT]
> **No Hardcoded Localhost:**  
> In Phase 19, `frontend/lib/api.ts` and `frontend/app/page.tsx` were hardened. The frontend will not attempt silent localhost requests. If `NEXT_PUBLIC_API_URL` is omitted, it defaults to relative `/api` behind Nginx.

---

## 3. Service Commands

```bash
# Start frontend service
sudo systemctl start floxa-frontend

# Enable on boot
sudo systemctl enable floxa-frontend

# Check status
sudo systemctl status floxa-frontend

# Inspect logs
sudo journalctl -u floxa-frontend -f
```

---

## 4. Verification Probes

Test from the VPS terminal:
```bash
# Probe internal Next.js server
curl -s -I http://127.0.0.1:3001
# Expected: HTTP/1.1 200 OK
# X-Powered-By: Next.js
```
