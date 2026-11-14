# FLOXA WORK — PHASE 21 PRODUCTION OPERATIONS RUNBOOK

**Target Platform:** Self-Hosted Hostinger VPS (Ubuntu Linux)  
**Audience:** Platform Operators, Sysadmins, On-Call Engineering  
**Version:** 1.0.0 (Production Beta)  

---

## 1. Quick Service Control Commands

| Action | Command |
| :--- | :--- |
| **Check All Service Statuses** | `sudo systemctl status floxa-backend floxa-frontend mongod nginx` |
| **Restart Backend API & WebSockets** | `sudo systemctl restart floxa-backend` |
| **Restart Frontend Next.js Server** | `sudo systemctl restart floxa-frontend` |
| **Restart MongoDB Database** | `sudo systemctl restart mongod` |
| **Reload Nginx Configuration** | `sudo nginx -t && sudo systemctl reload nginx` |
| **Inspect Backend Logs (Live)** | `sudo journalctl -u floxa-backend -f -n 100` |
| **Inspect Frontend Logs (Live)** | `sudo journalctl -u floxa-frontend -f -n 100` |
| **Inspect Nginx Access Logs** | `sudo tail -f /var/log/nginx/access.log` |
| **Inspect Nginx Error Logs** | `sudo tail -f /var/log/nginx/error.log` |

---

## 2. Emergency Operational Playbooks

### Playbook 1: Hostinger VPS Reboot Recovery
All services are registered with systemd `WantedBy=multi-user.target`.
Upon reboot:
1. `mongod.service` starts automatically.
2. `floxa-backend.service` waits for `mongod` and starts automatically.
3. `floxa-frontend.service` waits for backend and starts automatically.
4. `nginx.service` starts automatically on port 80/443.
5. **Operator Check:** Verify by querying `curl -I http://127.0.0.1:5001/health/live` and `curl -I http://127.0.0.1:3001`.

---

### Playbook 2: Memory Pressure / OOM Crash
If Next.js or MongoDB crashes with `Out of memory` in `dmesg`:
1. Check available RAM and swap: `free -h`.
2. Inspect OOM-killer log: `sudo dmesg -T | grep -i oom`.
3. If swap is inactive, allocate a 2 GB swapfile immediately as described in [`PHASE_21_RESOURCE_CAPACITY.md`](file:///d:/flumenx/floxa%20univerce/floxa%20work/docs/PHASE_21_RESOURCE_CAPACITY.md).
4. Restart services: `sudo systemctl restart floxa-backend floxa-frontend`.

---

### Playbook 3: Secret Rotation Protocol (Emergency Key Leak)
1. Generate new 64-character hex secrets:
   ```bash
   NEW_ACCESS=$(openssl rand -hex 32)
   NEW_REFRESH=$(openssl rand -hex 32)
   ```
2. Edit `/etc/floxa/backend.env` and update `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
3. Restart backend: `sudo systemctl restart floxa-backend`.
4. All existing user sessions are instantly invalidated across the marketplace; users must log in again.

---

### Playbook 4: Single User Compromised Session Revocation
To revoke all sessions for a specific user without rotating platform-wide secrets:
1. Connect to MongoDB: `mongosh -u floxa_work_app_user -p --authenticationDatabase floxa_work_prod floxa_work_prod`.
2. Delete active refresh tokens or increment token version for that user ID:
   ```javascript
   db.users.updateOne({ email: "compromised_user@example.com" }, { $inc: { tokenVersion: 1 } });
   ```
