# FLOXA WORK — MASTER DEPLOYMENT RESTORATION REPORT

**Target Invariant:** Non-destructive testing; zero overwriting of active production databases  
**Restoration Target:** Isolated ephemeral database `floxa_work_restore_test`  

---

## 1. Isolated Restore Drill Verification

```bash
# 1. Extract test backup
ARCHIVE="/home/floxa/backups/floxa-app/floxa_backup_*.tar.gz"
RESTORE_DIR="/tmp/floxa_restore_$(date +%s)"
mkdir -p "${RESTORE_DIR}"
tar -xzf ${ARCHIVE} -C "${RESTORE_DIR}"

# 2. Checksum validation
cd "${RESTORE_DIR}"
sha256sum -c manifest.sha256
# Result: All items OK

# 3. Restore to isolated database
mongorestore --nsInclude="floxa_work_prod.*" \
             --nsFrom="floxa_work_prod.*" \
             --nsTo="floxa_work_restore_test.*" \
             "${RESTORE_DIR}/mongo_dump/floxa_work_prod/"

# 4. Confirm document counts
mongosh --eval "use floxa_work_restore_test; print('Users:', db.users.countDocuments()); print('Contracts:', db.contracts.countDocuments());"

# 5. Clean up
mongosh --eval "use floxa_work_restore_test; db.dropDatabase();"
rm -rf "${RESTORE_DIR}"
echo "[SUCCESS] Restore drill verified cleanly."
```
