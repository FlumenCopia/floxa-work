# FLOXA WORK — PHASE 21 RESOURCE CAPACITY & FEASIBILITY ASSESSMENT

**Document Version:** 1.0.0 (Self-Hosted Architecture)  
**Target Environment:** Hostinger Cloud / KVM VPS (Ubuntu Linux)  
**Auditor:** Antigravity Autonomous Infrastructure & Deployment Harness  

---

## 1. Workload Sizing & Component Footprint

A self-hosted deployment consolidates the database, backend, real-time WebSockets, frontend SSR server, and reverse proxy onto a single Linux instance. The memory and CPU budget is calculated as follows:

```text
========================================================================
  FLOXA WORK — RUNTIME MEMORY FOOTPRINT PROJECTION
========================================================================
  Component               Min RAM (Idle)   Target RAM (Active)   Peak (Build/Heavy)
  ------------------------------------------------------------------------
  Linux OS + systemd      150 MB           250 MB                300 MB
  MongoDB 7.0 (WiredTiger) 256 MB           512 MB                768 MB (capped)
  Node.js Backend (5001)  80 MB            180 MB                300 MB
  Next.js Frontend (3001) 90 MB            200 MB                350 MB
  Nginx Reverse Proxy     15 MB            30 MB                 50 MB
  Fail2ban / Background   25 MB            40 MB                 50 MB
  ------------------------------------------------------------------------
  TOTAL RUNTIME NEED:     616 MB           1,212 MB              1,818 MB
========================================================================
```

---

## 2. Resource Feasibility by Hostinger VPS Tier

### Tier 1: Hostinger KVM 1 (1 vCPU, 4 GB RAM, 50 GB NVMe Disk) — **HIGHLY RECOMMENDED**
- **Feasibility:** **EXCELLENT (100% Beta Feasibility)**.
- **Analysis:** 4 GB RAM provides ample headroom for concurrent MongoDB queries, Next.js page caching, in-memory WebSocket connections, and background backup compression.
- **Next.js Compilation:** Turbopack builds comfortably without OOM (Out of Memory) risk.

### Tier 2: Hostinger KVM 2 (2 vCPU, 8 GB RAM, 100 GB NVMe Disk)
- **Feasibility:** **OPTIMAL FOR EXPANDED BETA (1,000+ Concurrent Users)**.
- **Analysis:** High concurrency capacity; permits automated Redis caching if horizontal scaling is adopted in future phases.

### Tier 3: Budget 1 GB / 2 GB RAM Instance
- **Feasibility:** **MARGINAL / SWAP REQUIRED**.
- **Analysis:** A 1 GB or 2 GB VPS will experience memory pressure during Next.js production builds (`next build` peaks at ~1.2 GB RAM). If the operator's VPS has only 1 GB or 2 GB RAM, a 2 GB swap file must be configured to prevent build termination.

---

## 3. Swap Configuration Procedure (For Instances with <= 2 GB RAM)

If the Hostinger VPS has 2 GB or less RAM, the operator should enable a 2 GB swapfile before running `next build`:

```bash
# Verify existing swap
swapon --show

# Allocate 2GB swapfile
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make permanent in /etc/fstab
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Tune swappiness to 10 (favoring physical RAM)
sysctl vm.swappiness=10
echo 'vm.swappiness=10' | tee -a /etc/sysctl.conf
```

---

## 4. Disk Storage Budget & Retention

- **Operating System & Packages:** ~3.5 GB
- **Node.js & Dependencies (`node_modules`):** ~1.2 GB
- **Application Builds (`dist/` and `.next/`):** ~450 MB
- **MongoDB Data (`/var/lib/mongodb`):** ~500 MB (initial beta scale)
- **Private Deliverable Vault (`/var/lib/floxa-work/private_vault`):** ~5.0 GB budget
- **Local Backup Archives (`/var/backups/floxa-work`):** ~4.0 GB budget (14-day retention)
- **Total Recommended Free Disk Space:** Minimum 15 GB free disk.
