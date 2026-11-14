# FLOXA WORK — PHASE 21 PRODUCTION BACKUP & DISASTER RECOVERY

**Execution Script:** `scripts/vps/05_backup_and_maintenance.sh`  
**Scheduled Runner:** systemd timer or cron (`0 2 * * *`)  
**Archive Target:** `/var/backups/floxa-work/`  
**Integrity Validation:** SHA-256 Checksum Manifests  

---

## 1. Backup Scope & Architecture

The backup script captures three critical components in a single consolidated, compressed archive:
1. **MongoDB Database:** Full dump of `floxa_work_prod` (collections, indexes, metadata) using `mongodump`.
2. **Private Deliverable Vault:** Full tarball archive of `/var/lib/floxa-work/private_vault/` preserving file permissions and directory trees.
3. **Integrity Manifest:** SHA-256 checksum generated for every exported asset.

```text
/var/backups/floxa-work/
├── floxa_backup_20261114_020000.tar.gz  (Consolidated Archive)
│   ├── mongo_dump/floxa_work_prod/      (BSON & JSON metadata)
│   ├── private_vault.tar.gz             (Encrypted deliverables)
│   └── manifest.sha256                  (SHA-256 signatures)
```

---

## 2. Automated Daily Cron Job Setup

Run this command on the VPS as user `floxa` (or root):

```bash
# Add daily backup at 02:00 AM server time
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/floxa-work/scripts/vps/05_backup_and_maintenance.sh >> /var/log/floxa-backup.log 2>&1") | crontab -
```

---

## 3. Off-Server Remote Replication (Disaster Protection)

> [!WARNING]
> **Hostinger VPS Loss Protection:**  
> Storing backups exclusively on `/var/backups/` protects against accidental software deletion, but **does not protect against VPS destruction, disk failure, or Hostinger account termination**.  
> The operator must configure off-server replication.

### Recommended Off-Site Methods:
1. **Hostinger Automated VPS Snapshots:** Enable daily/weekly snapshots in the Hostinger hPanel dashboard.
2. **Off-Site rsync / scp to Secondary Storage:**
   ```bash
   # Sync backup archives to a secondary storage server or NAS
   rsync -avz -e "ssh -p 22" /var/backups/floxa-work/ backup-user@remote-storage.example.com:/backups/floxa-vps/
   ```
3. **Encrypted S3 Cold Storage (rclone):**
   ```bash
   # Push encrypted archive to AWS S3 Glacier / Cloudflare R2 / Backblaze B2
   rclone copy /var/backups/floxa-work/ remote-r2:floxa-vps-backups/ --max-age 24h
   ```
