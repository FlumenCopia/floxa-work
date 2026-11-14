# FLOXA WORK — PHASE 19 OPERATIONS RUNBOOK

**Runbook Version:** 1.0.0 (Production Beta)  
**Target Systems:** Vercel (Frontend), Railway (Backend/WS), MongoDB Atlas (DB), Cloudflare R2 (Storage), Resend (Email)  
**Audience:** Platform Operators & On-Call Engineering  

---

## 1. System Health & Observability Quick Reference

| Component | Health Probe / Log Identifier | Healthy Indicator | Alert Condition |
| :--- | :--- | :--- | :--- |
| **Backend API** | `GET https://api.floxa.work/health/live` | `{"status":"ok"}` (HTTP 200) | HTTP 500, 502, or Timeout > 5s |
| **DB & Storage** | `GET https://api.floxa.work/health/ready` | `{"status":"ready"}` (HTTP 200) | HTTP 503 (`status: unready`) |
| **Frontend UI** | `GET https://app.floxa.work` | HTTP 200 + HTML payload | Vercel Deployment Error / Blank Screen |
| **WebSockets** | `WSS wss://api.floxa.work/ws` | Protocol 101 Switching Protocols | Socket connection refused or 401 |
| **Request ID** | Header `X-Request-Id` | UUID present in all HTTP responses | Missing header in response |

---

## 2. Emergency Incident Playbooks

### Playbook A: Total Service Outage (Backend Unreachable)
1. **Verify Outage Scope:**
   - Probe `curl -I https://api.floxa.work/health/live`. If Railway returns `502 Bad Gateway` or `Application Offline`, the backend container has crashed or halted.
2. **Inspect Railway Deployment Logs:**
   - Open Railway Dashboard > `floxa-work-backend` > Deployments > View Logs.
   - Look for fail-fast crash events:
     - `FATAL: Production database connection failed`: Atlas network access issue or invalid password.
     - `FATAL: Insecure or missing JWT secrets`: Environment variables wiped or corrupted.
3. **Restart Service:**
   - In Railway dashboard, click **Redeploy** or execute CLI: `railway up`.

---

### Playbook B: Database Failover & Connection Interruption
1. **Verify Readiness:**
   - Call `curl https://api.floxa.work/health/ready`.
   - Inspect JSON response: `"database": { "status": "disconnected" }`.
2. **Diagnose Atlas Health:**
   - Log into MongoDB Atlas Dashboard.
   - Check Cluster Metrics: CPU utilization, connection count, and replica set primary election.
   - Check Atlas Network Access: Verify that the Railway outbound IP has not changed or that the allowlist has not expired.
3. **Recovery:**
   - Atlas automatically re-elects a new primary within 5 seconds during hardware failure. Mongoose will reconnect automatically once the primary is online.

---

### Playbook C: Compromised User Session / Token Revocation
1. **Revoke Single User Tokens:**
   - If an account is reported compromised or a token is leaked:
   - Platform admin navigates to Admin Operations > User Management > click **Revoke All Sessions**.
   - Under the hood, this increments `user.tokenVersion` or purges the user's active refresh tokens from the database, instantly invalidating all access tokens.
2. **Revoke Entire Platform Tokens (Emergency Key Rotation):**
   - In Railway dashboard variables, generate and update `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to new 64-character random strings.
   - Redeploy the backend. All active user sessions platform-wide are instantly invalidated; users must re-authenticate.

---

### Playbook D: Secret Rotation Protocol

1. **Atlas Database Password:**
   - In Atlas Database Access, update password for `floxa_work_app_user`.
   - In Railway Variables, update `MONGODB_URI` with the new password.
   - Trigger backend redeploy. Zero downtime with rolling restart.
2. **Cloudflare R2 Keys:**
   - In Cloudflare Dashboard > R2 > Manage R2 API Tokens, create a secondary token.
   - In Railway Variables, update `CLOUDFLARE_R2_ACCESS_KEY_ID` and `CLOUDFLARE_R2_SECRET_ACCESS_KEY`.
   - Redeploy backend. Confirm `/health/ready` reports storage `online`. Delete old R2 token.
3. **Resend API Key:**
   - In Resend dashboard, create a new API key. Update `RESEND_API_KEY` in Railway, redeploy, delete old key.

---

## 3. Hosting Provider Support Contacts

- **Railway Status & Support:** [status.railway.app](https://status.railway.app) | Email: team@railway.app
- **Vercel Status & Support:** [vercel-status.com](https://www.vercel-status.com) | Help Center: vercel.com/help
- **MongoDB Atlas Status:** [status.mongodb.com](https://status.mongodb.com) | Support Portal: support.mongodb.com
- **Cloudflare Status:** [cloudflarestatus.com](https://www.cloudflarestatus.com)
- **Resend Status:** [resend-status.com](https://resend-status.com)
