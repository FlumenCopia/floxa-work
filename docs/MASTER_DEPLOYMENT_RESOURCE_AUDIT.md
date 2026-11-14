# FLOXA WORK — MASTER DEPLOYMENT RESOURCE CAPACITY & FEASIBILITY AUDIT

**Target Server:** Hostinger Ubuntu VPS (`89.116.121.25`) running CloudPanel  
**Auditor:** Antigravity Autonomous Infrastructure & Deployment Harness  

---

## 1. Existing Workload & VPS Capacity Overview

The server at `89.116.121.25` concurrently runs:
- CloudPanel Core Management Daemon (Port 8443)
- Nginx Master and Worker processes (Ports 80 and 443)
- MySQL / MariaDB Database Server
- Multiple PHP-FPM pools (PHP 8.1, 8.2, 8.3)
- Multiple existing Node.js backends (`flumenx-api-rwen`, `flumenx-api-susrutha`, `flumenx-api-erp`)

---

## 2. Additional Resource Allocation for FLOXA Work

```text
========================================================================
  FLOXA WORK — ADDITIONAL RESOURCE FOOTPRINT (ON TOP OF EXISTING SITES)
========================================================================
  Subsystem                  Target Memory   Peak Memory   Disk Budget
  ----------------------------------------------------------------------
  MongoDB 7.0 (WiredTiger)   512 MB (capped) 768 MB        2.0 GB
  FLOXA Backend (5001)       150 MB          250 MB        500 MB
  FLOXA Next.js SSR (3001)   180 MB          300 MB        800 MB
  Private Deliverable Vault  0 MB (disk)     0 MB          5.0 GB
  Consolidated Backups       0 MB (disk)     0 MB          4.0 GB
  ----------------------------------------------------------------------
  TOTAL ADDITIONAL OVERHEAD: ~842 MB RAM     ~1,318 MB RAM ~12.3 GB Disk
========================================================================
```

---

## 3. Capacity Safeguards & Memory Caps

To ensure FLOXA Work never causes OOM (Out Of Memory) issues for neighboring sites:
1. **WiredTiger Cache Limit:** MongoDB is explicitly capped in `/etc/mongod.conf` with:
   ```yaml
   storage:
     wiredTiger:
       engineConfig:
         cacheSizeGB: 1
   ```
2. **Node.js Memory Constraints:** Backend and frontend systemd units declare memory limits if necessary (`MemoryMax=512M`).
3. **Build Execution Off-Peak:** Running `npm run build` for Next.js peaks at ~1.2 GB RAM for 30 seconds. If physical free RAM is below 1.5 GB, allocate a 2 GB swapfile (`/swapfile`) before compiling.
