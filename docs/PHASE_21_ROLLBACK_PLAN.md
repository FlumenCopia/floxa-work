# FLOXA WORK — PHASE 21 PRODUCTION ROLLBACK PLAN

**Target Platform:** Self-Hosted Hostinger VPS (Ubuntu Linux)  
**Emergency Objective:** Roll back software or database state within < 5 minutes  
**Auditor:** Antigravity Autonomous Infrastructure & Deployment Harness  

---

## 1. Rollback Matrix by Failure Domain

| Failure Scenario | Target Action | Rollback Command | Estimated MTTR |
| :--- | :--- | :--- | :--- |
| **Frontend Runtime Error / Blank Page** | Revert Next.js Build | `git checkout HEAD~1 && npm run build && systemctl restart floxa-frontend` | < 2 minutes |
| **Backend API Crash Loop** | Revert Backend Build | `git checkout HEAD~1 && npm run build && systemctl restart floxa-backend` | < 1 minute |
| **Nginx Syntax / Routing Failure** | Restore Previous Config | `cp /etc/nginx/sites-available/floxa-work.bak /etc/nginx/sites-available/floxa-work && nginx -s reload` | < 30 seconds |
| **Database Corruption / Accidental Purge** | Restore from Daily Snapshot | `mongorestore --drop --db floxa_work_prod /var/backups/...` | < 5 minutes |

---

## 2. Step-by-Step Code Rollback Procedure

When logged into the VPS terminal:

```bash
cd /var/www/floxa-work

# 1. Inspect recent commits to identify last healthy commit
git log -n 5 --oneline

# 2. Check out previous commit or revert
git checkout 3fde46b

# 3. Rebuild backend
cd /var/www/floxa-work/backend
npm install
npm run build
sudo systemctl restart floxa-backend

# 4. Rebuild frontend
cd /var/www/floxa-work/frontend
npm install
npm run build
sudo systemctl restart floxa-frontend

# 5. Verify health probes
curl -s http://127.0.0.1:5001/health/live | jq
curl -I http://127.0.0.1:3001
```
