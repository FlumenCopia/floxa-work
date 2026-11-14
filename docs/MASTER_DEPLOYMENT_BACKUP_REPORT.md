# FLOXA WORK — MASTER DEPLOYMENT BACKUP REPORT

**Execution Script:** `scripts/cloudpanel/backup_floxa.sh`  
**Backup Path:** `/home/floxa/backups/floxa-app/`  
**Schedule:** Daily at 02:00 AM via cron  
**Retention Policy:** 14 Days Automated Pruning  

---

## 1. Backup Scope & Data Safety Invariants

- **Isolated to FLOXA Work:** Dumps only MongoDB database `floxa_work_prod` and tarballs `/home/floxa/private_vault/`.
- **Zero Impact on MySQL:** MySQL databases used by neighboring sites (`flumenx`, `rwen-interiors`, `susrutha`, `foresight`) are never dumped, locked, or touched.
- **Integrity Manifest:** SHA-256 signatures are generated for every backup asset.
- **Off-Server Copy:** Operator should configure automated rsync or Hostinger hPanel automated snapshot backups to protect against VPS disk failure.
