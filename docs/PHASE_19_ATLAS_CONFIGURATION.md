# FLOXA WORK — PHASE 19 MONGODB ATLAS CONFIGURATION GUIDE

**Document Version:** 1.0.0 (Production Beta)  
**Target Cluster:** MongoDB Atlas M0 (Free Evaluation) / M10 (Recommended Beta Production)  
**Database Name:** `floxa_work_prod`  
**Driver Compatibility:** Mongoose 8.12.x / Node.js MongoDB Driver 6.x  

---

## 1. Security Architecture & Provisioning Rules

To protect marketplace integrity and user data, the following non-negotiable security requirements must be enforced during Atlas provisioning:

### 1.1 Dedicated Production Database & Restricted Database User
1. Create a dedicated Atlas project: `floxa-work-production`.
2. Do **not** use the Atlas cluster owner or admin user for application runtime connections.
3. Create a restricted application user:
   - **Username:** `floxa_work_app_user`
   - **Authentication Method:** SCRAM-SHA-256 (Password Authentication).
   - **Password:** Generate a 36-character cryptographically random string (e.g., using `openssl rand -base64 32`).
   - **Roles and Privileges:** Restrict user to `readWrite` on `floxa_work_prod` only.
     ```javascript
     {
       "roles": [
         { "role": "readWrite", "db": "floxa_work_prod" }
       ]
     }
     ```
   - **Prohibited Permissions:** Do not grant `atlasAdmin`, `dbAdminAnyDatabase`, or `clusterMonitor` to the application user.

### 1.2 Network Access & IP Allowlisting Policy
1. **Never use `0.0.0.0/0` as the permanent production network rule.**
2. When deploying to Railway:
   - Identify Railway's static outbound IP addresses (if using Railway Team/Enterprise plan with static egress) and add only those IPs to the Atlas Network Access list.
   - If using dynamic cloud egress on Railway Developer plan, add the temporary Railway egress IP range, or use Atlas Private Link / VPC Peering (on AWS/GCP).
   - If a temporary wide allowlist is necessary during initial setup, configure an expiration window of 4 hours in the Atlas dashboard and document compensating controls:
     - Compensating Control 1: SCRAM-SHA-256 authentication with high-entropy credentials.
     - Compensating Control 2: TLS 1.3 encrypted transport enforced cluster-wide.
     - Compensating Control 3: Atlas Audit Logging enabled for connection anomalies.

### 1.3 TLS 1.3 Transport Encryption
- All Atlas connection strings must specify `tls=true` and `retryWrites=true&w=majority`.
- Minimum TLS protocol version in Atlas project settings must be configured to **TLS 1.2+** (TLS 1.3 preferred).

---

## 2. Production Connection String Format

```bash
MONGODB_URI="mongodb+srv://floxa_work_app_user:<STRONG_UNIQUE_PASSWORD>@floxa-work-cluster.mongodb.net/floxa_work_prod?retryWrites=true&w=majority&appName=FloxaWorkProd"
```

> [!CAUTION]
> **Production vs Development Isolation:**  
> Verify that `MONGODB_URI` points explicitly to `floxa_work_prod` on Atlas. The backend's `env.ts` will abort startup in production if `MONGODB_URI` contains `localhost`, `127.0.0.1`, or default development credentials.

---

## 3. Database Initialization & Essential Indexes

The backend uses Mongoose schemas that automatically declare optimized indexes on connection. The production administrator should verify that the following compound and unique indexes are active:

| Collection | Index Specification | Type | Purpose |
| :--- | :--- | :--- | :--- |
| `users` | `{ email: 1 }` | Unique | Fast authentication lookup; prevents duplicate accounts. |
| `talentprofiles` | `{ userId: 1 }` | Unique | 1-to-1 profile mapping. |
| `talentprofiles` | `{ "skills.name": 1, rating: -1, hourlyRate: 1 }` | Compound | Fast discovery filter and sorting. |
| `contracts` | `{ clientId: 1, status: 1 }` | Compound | Client workspace query optimization. |
| `contracts` | `{ freelancerId: 1, status: 1 }` | Compound | Freelancer workspace query optimization. |
| `milestones` | `{ contractId: 1, order: 1 }` | Compound | Milestone timeline ordering. |
| `filerecords` | `{ filename: 1 }` | Unique | Vault filename resolution. |
| `filerecords` | `{ ownerId: 1, isPublic: 1 }` | Compound | User file listing and permission checks. |
| `auditlogs` | `{ createdAt: -1 }` | Single (TTL optional) | Chronological compliance logs. |
| `disputes` | `{ contractId: 1, status: 1 }` | Compound | Dispute resolution tracking. |

---

## 4. Backup Retention & Disaster Recovery Capabilities

| Atlas Tier | Backup Mechanism | Retention Period | Point-in-Time Restore (PITR) | Recommended Usage |
| :--- | :--- | :--- | :--- | :--- |
| **M0 (Shared)** | Manual `mongodump` via automated runner | Operator-managed | No | Development / Evaluation only |
| **M10+ (Dedicated)** | Continuous Cloud Backups (Automated Snapshots) | 7 to 35 days configurable | Yes (1-minute granularity) | **Recommended for Production Beta** |

### Automated Off-Site Backup Script
FLOXA Work includes a standalone backup utility in `backend/scripts/backup_db.cjs` that exports collections with SHA-256 integrity checksums, ready for encrypted storage in Cloudflare R2 or an off-site S3 cold vault.
