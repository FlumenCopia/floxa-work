# FLOXA WORK — PHASE 21 PERSISTENT PRIVATE FILE STORAGE

**Storage Root:** `/var/lib/floxa-work/private_vault`  
**Provider Adapter:** `LocalStorageProvider` (`backend/src/services/storage/`)  
**Authorization Controller:** `backend/src/controllers/file.controller.ts`  

---

## 1. Storage Architecture & Directory Permissions

All private milestone deliverable files, project contract attachments, and payment receipts are stored outside the public web root in a dedicated, isolated filesystem hierarchy:

```text
/var/lib/floxa-work/
└── private_vault/           # Directory permissions: 700 (floxa:floxa)
    ├── deliverables/        # Milestone submission packages
    ├── receipts/            # External payment slips / UTR proofs
    └── general/             # Contract attachments
```

### Security Invariants:
1. **Zero Public Web Exposure:** Nginx does **not** serve `/var/lib/floxa-work/` or declare an `alias` or `root` pointing to this directory.
2. **Server-Side Authorization Required:** Every file download request to `/api/files/:fileId/download` must present a valid JWT session.
3. **Role & Participant Authorization:** The controller validates that `req.user.id` is the file owner, an administrator, or an authorized participant in the associated contract/milestone/payment record.
4. **Unauthenticated & Unauthorized Rejection:** Anonymous requests return `401 Unauthorized`; unrelated authenticated users receive `403 Access Denied` and trigger an immutable `UNAUTHORIZED_FILE_ACCESS_ATTEMPT` audit log.
5. **File Restrictions:** Maximum file size is strictly capped at **50 MB**. Allowed MIME types are restricted to safe types (images, PDF, ZIP, text). Executables (`.exe`, `.sh`, `.php`) are rejected by the upload middleware.

---

## 2. Directory Initialization & Permission Commands

```bash
# Create directory
mkdir -p /var/lib/floxa-work/private_vault

# Set ownership to service user floxa
chown -R floxa:floxa /var/lib/floxa-work

# Restrict permissions so no other Linux user or web server can read it directly
chmod 700 /var/lib/floxa-work/private_vault
```

---

## 3. Storage Verification Test Protocol

| Test ID | Test Scenario | Command / Request | Expected Result |
| :--- | :--- | :--- | :--- |
| **ST-01** | Authorized Upload | `POST /api/files/upload` (with client JWT) | `201 Created` + File saved in private vault |
| **ST-02** | File Persistence | `ls -la /var/lib/floxa-work/private_vault` | File exists with salted unique filename |
| **ST-03** | Service Restart | `systemctl restart floxa-backend` | File persists intact after service reboot |
| **ST-04** | Authorized Download | `GET /api/files/:id/download` (contract participant) | `200 OK` (Streams file cleanly) |
| **ST-05** | Unauthenticated Download | `GET /api/files/:id/download` (no auth header) | `401 Unauthorized` |
| **ST-06** | Unauthorized Download | `GET /api/files/:id/download` (unrelated user) | `403 Forbidden` + AuditLog generated |
| **ST-07** | Deletion Lifecycle | Delete file via API or contract closeout | File unlinked cleanly from disk |
