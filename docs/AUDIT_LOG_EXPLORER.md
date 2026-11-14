# FLOXA Work — Immutable Audit Log Explorer

**Module:** Administrative Audit Trail & Compliance Logging  
**Route:** `GET /api/admin/audit-logs`  
**Security Tier:** `audit:view` Permission Guarded  
**Database Collection:** `auditlogs` (MongoDB)  
**Date:** 14 November 2026  

---

## 1. Architectural Purpose & Immutability

The FLOXA Work Audit Log Explorer provides platform operators with a tamper-evident record of all critical system events, privileged operations, account status modifications, and data access activities.

### Immutability Guarantees
1. **Append-Only Schema:** The `AuditLog` collection contains zero update or delete endpoints.
2. **Actor Attribution:** Every administrative action captures the authenticated operator's MongoDB `ObjectId`, action type, IP address, user-agent, and relevant metadata.
3. **Restricted Querying:** Only users with `audit:view` permission (`super_admin`, `operations_admin`) can inspect audit records. Ordinary platform users and support operators are rejected with `HTTP 403 Forbidden`.

---

## 2. Audited System Events

| Action Code | Trigger Event | Metadata Captured |
| :--- | :--- | :--- |
| `USER_SUSPENDED` | Operator suspends a user account | Target user ID, reason, admin ID |
| `USER_REINSTATED` | Operator reactivates a suspended user | Target user ID, reason, admin ID |
| `USER_RESTRICTIONS_UPDATED` | Messaging or invitation restrictions set | Restriction flags, reason |
| `ADMIN_ROLE_UPDATED` | Super Admin modifies an admin's sub-role | Target admin ID, previous role, new role |
| `DATA_EXPORT_GENERATED` | Operator generates and downloads a CSV export | Export type (`users`, `contracts`, `moderation`, `external-payment-records`) |
| `DISPUTE_STATUS_CHANGED` | Moderator resolves, closes, or updates a dispute | Dispute ID, resolution outcome, internal note |
| `REVIEW_MODERATED` | Moderator hides or restores a public review | Review ID, moderation reason |
| `SAFETY_REPORT_RESOLVED` | Moderator acts on a user safety report | Report ID, action taken |

---

## 3. Querying & Filtering Capabilities

The `GET /api/admin/audit-logs` endpoint supports faceted querying:
- `action`: Filter by exact action identifier (e.g., `DATA_EXPORT_GENERATED`).
- `targetType`: Filter by entity type (`User`, `Contract`, `Dispute`, `Review`, `Export`).
- `actorId`: Filter by the performing administrator's ID.
- `startDate` & `endDate`: Filter by ISO date boundaries.
- `page` & `limit`: Paginated record retrieval (default: 50 records/page).

