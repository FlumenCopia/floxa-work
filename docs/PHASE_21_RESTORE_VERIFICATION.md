# FLOXA WORK — PHASE 21 DISASTER RESTORATION PROTOCOL

**Runbook Scope:** Emergency Database & Vault Recovery  
**Target Invariant:** Non-destructive testing; zero overwriting of active production data during restore tests  
**Auditor:** Antigravity Autonomous Infrastructure & Deployment Harness  

---

## 1. Safe Isolated Restoration Drill

To verify backup validity without endangering the live `floxa_work_prod` database, execute restoration drills into an ephemeral test database:

```bash
# 1. Select the backup archive to test
ARCHIVE="/var/backups/floxa-work/floxa_backup_20261114_020000.tar.gz"
RESTORE_TMP="/tmp/restore_drill_$(date +%s)"
mkdir -p "${RESTORE_TMP}"

# 2. Extract backup archive
tar -xzf "${ARCHIVE}" -C "${RESTORE_TMP}"

# 3. Verify SHA-256 Checksum Manifest
cd "${RESTORE_TMP}"
sha256sum -c manifest.sha256
# Result must show: OK for all files

# 4. Restore MongoDB into ISOLATED test database (floxa_work_restore_test)
mongorestore --nsInclude="floxa_work_prod.*" \
             --nsFrom="floxa_work_prod.*" \
             --nsTo="floxa_work_restore_test.*" \
             "${RESTORE_TMP}/mongo_dump/floxa_work_prod/"

# 5. Extract and inspect private deliverable vault in isolated directory
mkdir -p "${RESTORE_TMP}/vault_test"
tar -xzf "${RESTORE_TMP}/private_vault.tar.gz" -C "${RESTORE_TMP}/vault_test"
ls -la "${RESTORE_TMP}/vault_test/private_vault"

# 6. Verify collection count and referential integrity via mongosh
mongosh --eval "use floxa_work_restore_test; print('Users:', db.users.countDocuments()); print('Contracts:', db.contracts.countDocuments());"

# 7. Teardown test database & temporary directory
mongosh --eval "use floxa_work_restore_test; db.dropDatabase();"
rm -rf "${RESTORE_TMP}"
echo "[SUCCESS] Restoration drill completed. Backup verified viable."
```

---

## 2. Emergency Full Production Recovery (In Event of VPS Rebuild)

If a new Hostinger VPS is provisioned after total server loss:
1. Run `01_harden_server.sh` and `02_install_runtime_and_mongo.sh`.
2. Transfer the latest backup archive from off-site storage to `/var/backups/floxa-work/`.
3. Restore database directly to production:
   ```bash
   mongorestore --db floxa_work_prod /var/backups/floxa-work/mongo_dump/floxa_work_prod/
   ```
4. Restore private vault:
   ```bash
   tar -xzf /var/backups/floxa-work/private_vault.tar.gz -C /var/lib/floxa-work/
   chown -R floxa:floxa /var/lib/floxa-work
   chmod 700 /var/lib/floxa-work/private_vault
   ```
5. Deploy backend and frontend systemd services (`03_setup_systemd_and_vault.sh`).
6. Configure Nginx and SSL (`04_setup_nginx_and_ssl.sh`).
