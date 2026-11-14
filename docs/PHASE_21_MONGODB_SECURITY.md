# FLOXA WORK — PHASE 21 MONGODB USER CREATION & SECURITY PROTOCOL

**Database Name:** `floxa_work_prod`  
**Application User:** `floxa_work_app_user`  
**Authentication Mechanism:** SCRAM-SHA-256  
**Auditor:** Antigravity Autonomous Infrastructure & Deployment Harness  

---

## 1. Security Architecture & Restricted Privileges

In strict compliance with production database standards:
- **Zero Anonymous Connections:** `security.authorization: enabled` enforces authentication for all operations.
- **Dedicated Application User:** The application does **not** connect as `admin`, `root`, or cluster administrator.
- **Scope Restriction:** `floxa_work_app_user` is granted `readWrite` access exclusively on database `floxa_work_prod`. It cannot query or manipulate system databases (`admin`, `config`, `local`).

---

## 2. User Creation Commands (Executed via `mongosh`)

Execute these commands in the VPS terminal using `mongosh`:

```javascript
// Step 1: Connect to local MongoDB shell
// mongosh

// Step 2: Switch to admin database to create root admin (for maintenance only)
use admin;

// Generate strong password for admin: openssl rand -base64 32
db.createUser({
  user: "floxa_vps_admin",
  pwd: "<GENERATE_STRONG_ADMIN_PASSWORD>",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, { role: "readWriteAnyDatabase", db: "admin" } ]
});

// Step 3: Switch to production database
use floxa_work_prod;

// Generate strong unique password for application user: openssl rand -base64 32
db.createUser({
  user: "floxa_work_app_user",
  pwd: "<GENERATE_STRONG_APP_PASSWORD>",
  roles: [
    { role: "readWrite", db: "floxa_work_prod" }
  ]
});

// Step 4: Verify authentication
db.auth("floxa_work_app_user", "<GENERATE_STRONG_APP_PASSWORD>");
// Expected output: { ok: 1 }
```

---

## 3. Mongoose Connection String Specification

Update `/etc/floxa/backend.env` with the authenticated connection string:

```bash
MONGODB_URI="mongodb://floxa_work_app_user:<APP_PASSWORD>@127.0.0.1:27017/floxa_work_prod?authSource=floxa_work_prod"
```

> [!CAUTION]
> **No Remote Access:**  
> The connection string connects to `127.0.0.1:27017`. MongoDB will refuse connections originating from outside the VPS.
