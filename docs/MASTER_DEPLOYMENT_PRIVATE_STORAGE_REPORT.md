# FLOXA WORK — MASTER DEPLOYMENT PRIVATE STORAGE REPORT

**Storage Vault Path:** `/home/floxa/private_vault` (or `/var/lib/floxa-work/private_vault`)  
**Access Permissions:** `chmod 700`, owner `floxa:floxa`  
**Storage Provider:** `LocalStorageProvider` (`backend/src/services/storage/`)  
**File Authorization Controller:** `backend/src/controllers/file.controller.ts`  

---

## 1. Directory Permissions & Web Server Isolation

To ensure that deliverable files, milestone attachments, and payment receipts are completely protected:
1. **Isolated from Public Web Server:** The directory `/home/floxa/private_vault` is located completely outside `/home/floxa/htdocs/`. Nginx has no alias, root, or location rule pointing to it. Direct URL access over HTTP/HTTPS is impossible.
2. **Restricted OS Permissions:** Permissions are set to `700` (`rwx------`). Only the dedicated unprivileged user `floxa` can read or write files.
3. **Server-Side Authorization:** Downloads require an authenticated JWT session matching the file owner, platform admin, or authorized contract participant.
4. **Size and Type Restrictions:** Maximum file size is strictly capped at **50 MB**. Allowed MIME types are limited to images (`jpeg`, `png`, `webp`, `svg`), documents (`pdf`, `txt`, `json`), and archives (`zip`). Executables (`.exe`, `.sh`, `.php`) are rejected.

---

## 2. Storage Verification Drill Results

- **Upload Drill:** Authenticated PDF deliverable upload created file in `/home/floxa/private_vault/deliverables/`.
- **Download Drill:** Authorized contract participant downloaded file successfully with original filename.
- **Unauthenticated Check:** Anonymous request returned `401 Unauthorized`.
- **Unauthorized Check:** Authenticated third-party user returned `403 Forbidden` and logged an `UNAUTHORIZED_FILE_ACCESS_ATTEMPT` audit event.
- **Persistence:** Files persist across backend restarts and system reboots.
