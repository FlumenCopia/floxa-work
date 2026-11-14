# FLOXA WORK — PHASE 21 BACKEND DEPLOYMENT GUIDE

**Runtime:** Node.js 20 LTS / Express / `ws` WebSockets  
**Port Binding:** `127.0.0.1:5001` (Internal Loopback Only)  
**Process Manager:** systemd (`floxa-backend.service`)  
**Deployment Path:** `/var/www/floxa-work/backend`  

---

## 1. Build and Deployment Procedure on VPS

When logged in as user `floxa`:

```bash
cd /var/www/floxa-work/backend

# 1. Install production dependencies
npm install

# 2. Compile TypeScript to ES Module JavaScript
npm run build
# Compiles src/ -> dist/

# 3. Verify compiled output
ls -la dist/server.js
```

---

## 2. Configuration & Fail-Safe Boot Verification

The backend requires these environment variables in `/etc/floxa/backend.env`:
- `NODE_ENV=production`: Activates secure cookies, error masking, and disables stack traces.
- `PORT=5001`: Sets internal listening port.
- `MONGODB_URI`: Connects to `mongodb://floxa_work_app_user:...@127.0.0.1:27017/floxa_work_prod`.
- `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`: High-entropy 64-character hex strings. The backend halts boot (`process.exit(1)`) if these are weak or default.
- `STORAGE_PROVIDER=local`: Operates persistent private vault in `/var/lib/floxa-work/private_vault`.
- `CORS_ORIGIN=https://app.floxa.work`: Strict origin whitelist.
- `TRUST_PROXY=true`: Instructs Express to trust Nginx reverse proxy headers.

---

## 3. Service Commands

```bash
# Start backend service
sudo systemctl start floxa-backend

# Enable on boot
sudo systemctl enable floxa-backend

# Check live status
sudo systemctl status floxa-backend

# Inspect real-time logs
sudo journalctl -u floxa-backend -f
```

---

## 4. Verification Probes

Test from the VPS terminal:
```bash
# Test liveness probe
curl -s http://127.0.0.1:5001/health/live | jq
# Expected: {"status":"ok","service":"floxa-work-backend"}

# Test readiness probe
curl -s http://127.0.0.1:5001/health/ready | jq
# Expected: {"status":"ready","database":{"status":"connected"}}
```
