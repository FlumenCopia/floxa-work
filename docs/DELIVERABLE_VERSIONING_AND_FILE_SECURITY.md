# FLOXA WORK — Phase 10: Deliverable Versioning & File Security

## 1. Version History Architecture
In real-world project execution, deliverables frequently require iterations. FLOXA Work preserves an append-only version history for every milestone submission:
- **Version 1 (Initial Submission):** Recorded with timestamp, notes, and file links.
- **Revision Request:** Client feedback is appended to `revisionRequests` with target submission version.
- **Version 2 (Resubmission):** Appended with `version: 2`, preserving Version 1 without overwriting.
- **Review Trail:** Each version maintains its own `reviewStatus`, `reviewFeedback`, `reviewedBy`, and `reviewedAt`.

---

## 2. Resource-Level Private File Security
All uploaded project assets, deliverable packages, and payment receipts are protected by server-side authorization:
1. **Public Guessing Prevention:** Files are served through authenticated streaming endpoints (`/api/files/:fileId/download`).
2. **Access Control Evaluation:**
   - Public assets (`isPublic: true`) are accessible to all authenticated users.
   - Private assets require the caller to be:
     - The file owner (`fileDoc.ownerId == req.user.id`), OR
     - A platform administrator (`req.user.role == 'admin'`), OR
     - A participant in a contract where the file is referenced in milestone submissions, payment receipts, or task attachments.
   - Any access attempt by unauthorized users triggers an audit log entry (`UNAUTHORIZED_FILE_ACCESS_ATTEMPT`) and aborts with `403 Forbidden`.
3. **Storage Hardening:**
   - Storage paths are fully sanitized; directory traversal characters (`../`, `..\`) are stripped.
   - Internal disk paths are never leaked to client payloads.
