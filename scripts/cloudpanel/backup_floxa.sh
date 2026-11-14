#!/usr/bin/env bash
# ==============================================================================
# FLOXA WORK — CLOUDPANEL SAFE DAILY BACKUP RUNNER
# Run as: floxa (or root) via cron
# Destination: /home/floxa/backups/floxa-app/
# Scope: Strictly isolates FLOXA database & private vault (0 impact on other sites)
# ==============================================================================

set -euo pipefail

BACKUP_ROOT="/home/floxa/backups/floxa-app"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_ROOT}/backup_${TIMESTAMP}"
RETENTION_DAYS=14

mkdir -p "${BACKUP_DIR}"

echo "[FLOXA BACKUP] Starting isolated backup at ${TIMESTAMP}..."

# 1. Dump MongoDB floxa_work_prod only (never touch MySQL or other DBs)
echo "[1/4] Dumping MongoDB database 'floxa_work_prod'..."
MONGODB_URI=""
if [ -f /etc/floxa/backend.env ]; then
    MONGODB_URI=$(grep -E '^MONGODB_URI=' /etc/floxa/backend.env | cut -d'=' -f2- || true)
fi

if [ -n "${MONGODB_URI}" ]; then
    mongodump --uri="${MONGODB_URI}" --out "${BACKUP_DIR}/mongo_dump" --quiet
else
    mongodump --db floxa_work_prod --out "${BACKUP_DIR}/mongo_dump" --quiet
fi

# 2. Archive Private Vault Deliverables
echo "[2/4] Archiving private deliverable vault..."
if [ -d "/home/floxa/private_vault" ]; then
    tar -czf "${BACKUP_DIR}/private_vault.tar.gz" -C /home/floxa private_vault
elif [ -d "/var/lib/floxa-work/private_vault" ]; then
    tar -czf "${BACKUP_DIR}/private_vault.tar.gz" -C /var/lib/floxa-work private_vault
fi

# 3. Generate SHA-256 Manifest
echo "[3/4] Generating checksums..."
cd "${BACKUP_DIR}"
find . -type f -exec sha256sum {} + > manifest.sha256

# Compress bundle
cd "${BACKUP_ROOT}"
tar -czf "floxa_backup_${TIMESTAMP}.tar.gz" "backup_${TIMESTAMP}"
rm -rf "backup_${TIMESTAMP}"

# 4. Prune old backups
echo "[4/4] Pruning archives older than ${RETENTION_DAYS} days..."
find "${BACKUP_ROOT}" -name "floxa_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete

echo "[FLOXA BACKUP] Finished successfully. Archive: ${BACKUP_ROOT}/floxa_backup_${TIMESTAMP}.tar.gz"
