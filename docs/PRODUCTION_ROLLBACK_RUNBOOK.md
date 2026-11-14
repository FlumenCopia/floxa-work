# FLOXA Work — Production Rollback Runbook

**Trigger:** Failed Deployment, Critical Regression, or SEV-1 Outage  
**Objective:** Restore previous known stable state within 5 minutes.  
**Date:** 14 November 2026  

---

## 1. Application Layer Rollback (PM2 / Container)

If a newly deployed release causes API crashes or severe regressions:

```bash
# Step 1: Revert code to previous verified Git release checkpoint
git checkout <previous-stable-commit-hash>

# Step 2: Re-install verified lockfile dependencies
cd backend && npm ci
cd ../frontend && npm ci

# Step 3: Re-compile
cd backend && npm run build
cd ../frontend && npm run build

# Step 4: Perform zero-downtime rolling reload
pm2 reload floxa-backend --update-env
pm2 reload floxa-frontend --update-env

# Step 5: Verify readiness
curl -f https://api.floxa.work/health/ready
```

---

## 2. Database Schema / Index Rollback

Because FLOXA Work employs non-destructive index migrations and append-only schemas:
1. No destructive drop commands are executed during release.
2. If an index causes slow queries, drop only the specific new index by name:
   ```javascript
   db.contracts.dropIndex("problematic_index_name");
   ```
3. If database restoration is required, execute `backend/scripts/restore-database.cjs` with the pre-deployment snapshot archive.

