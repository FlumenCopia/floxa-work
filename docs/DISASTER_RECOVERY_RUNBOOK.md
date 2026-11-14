# FLOXA Work — Disaster Recovery Runbook

**Severity:** P0 Emergency Operational Procedure  
**Target Systems:** MongoDB Persistence, Centralized Storage Vault, API Cluster  
**Audience:** Platform Reliability Engineers, On-Call Operations Leads, Incident Commanders  
**Date:** 14 November 2026  

---

## 1. Incident Classification & Triage

| Level | Severity | Example Scenario | Target RTO | Escalation Path |
| :---: | :---: | :--- | :---: | :--- |
| **DR-1** | Catastrophic | Cloud provider regional outage or total cluster loss | $\le 60\text{ min}$ | VP Engineering, Lead Architect, Legal |
| **DR-2** | Critical | Primary database node failure with failed replica election | $\le 30\text{ min}$ | Platform Lead, Lead Architect |
| **DR-3** | High | Accidental data corruption or malicious drop of collection | $\le 20\text{ min}$ | On-Call SRE, Lead Architect |

---

## 2. Emergency Recovery Procedures

### Scenario A: Standalone Dump Restoration to Staging or New Cluster

**Step 1: Isolate the Incident**
If data corruption is occurring, immediately place the frontend in maintenance mode or pause API traffic to prevent compounding writes.

**Step 2: Obtain the Verified Snapshot Archive**
Download the latest verified backup bundle from off-site object storage:
```bash
# Verify checksum prior to decompression
sha256sum -c floxa_work_backup_<timestamp>.tar.gz.sha256
```

**Step 3: Execute Controlled Restoration to Target Database**
Execute the automated restore script specifying the target database URI:
```bash
node backend/scripts/restore-database.cjs \
  --archive="backups/floxa_work_backup_<timestamp>.json" \
  --targetDb="mongodb://127.0.0.1:27017/floxa_work_restored_db"
```

**Step 4: Execute Post-Restoration Data Integrity Verification**
Verify document counts, active contracts, and recent audit logs:
```bash
node backend/tests/phase13_production_readiness.test.cjs
```

**Step 5: Route Production Traffic**
Update `DATABASE_URL` in production secret manager and trigger rolling restart.

---

## 3. Disaster Recovery Testing Cadence

- **Automated Verification:** Bi-weekly restore dry-run into isolated test cluster.
- **Tabletop Simulation:** Quarterly disaster recovery simulation with engineering team.
- **Zero Production Mutation:** Testing is strictly prohibited from running against live production connection strings.
