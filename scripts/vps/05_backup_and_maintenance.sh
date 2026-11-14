#!/usr/bin/env bash
# ==============================================================================
# FLOXA WORK — SCRIPT 05: AUTOMATED PRODUCTION BACKUP & ROTATION RUNNER
# Run as: floxa (or root) via cron: 0 2 * * * /var/www/floxa-work/scripts/vps/05_backup_and_maintenance.sh
# ==============================================================================

set -euo pipefail

BACKUP_ROOT="/var/backups/floxa-work"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_ROOT}/backup_${TIMESTAMP}"
RETENTION_DAYS=14

mkdir -p "${BACKUP_DIR}"

echo "[FLOXA BACKUP] Starting production backup at ${TIMESTAMP}..."

# 1. MongoDB Database Dump
echo "[1/4] Dumping MongoDB database 'floxa_work_prod'..."
mongodump --db floxa_work_prod --out "${BACKUP_DIR}/mongo_dump" --quiet

# 2. Archive Private Vault Deliverables
echo "[2/4] Archiving private deliverable vault..."
if [ -d "/var/lib/floxa-work/private_vault" ]; then
    tar -czf "${BACKUP_DIR}/private_vault.tar.gz" -C /var/lib/floxa-work private_vault
else
    echo "Notice: Private vault directory empty or not found."
fi

# 3. Generate SHA-256 Checksums
echo "[3/4] Generating checksum manifests..."
cd "${BACKUP_DIR}"
find . -type f -exec sha256sum {} + > manifest.sha256

# Compress entire backup bundle
cd "${BACKUP_ROOT}"
tar -czf "floxa_backup_${TIMESTAMP}.tar.gz" "backup_${TIMESTAMP}"
rm -rf "backup_${TIMESTAMP}"

# 4. Enforce Retention Policy (Purge backups older than RETENTION_DAYS)
echo "[4/4] Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_ROOT}" -name "floxa_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete

echo "[FLOXA BACKUP] Completed successfully. Archive: ${BACKUP_ROOT}/floxa_backup_${TIMESTAMP}.tar.gz"
