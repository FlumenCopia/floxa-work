# FLOXA WORK — MASTER DEPLOYMENT MONGODB REPORT

**Database Engine:** MongoDB 7.0 Community Edition (Self-Hosted on VPS)  
**Database Name:** `floxa_work_prod`  
**Application User:** `floxa_work_app_user`  
**Binding Address:** `127.0.0.1:27017` (Localhost Loopback Only)  
**Authentication Standard:** SCRAM-SHA-256  

---

## 1. Zero Impact on Existing MySQL / MariaDB Databases

The Hostinger VPS runs CloudPanel with active MySQL/MariaDB databases serving other businesses (`flumenx`, `foresight`, `rwen-interiors`, `susrutha`, `miscarchive`).
- **Isolation Guarantee:** MongoDB runs as a completely distinct daemon (`mongod.service`) on TCP port `27017`.
- **MySQL Intact:** Port `3306` (MySQL) is never touched, queried, or modified.
- **Port Security:** Port `27017` is bound strictly to `127.0.0.1`. It is invisible to the public internet and blocked by UFW firewall.

---

## 2. Installation & User Creation Commands

If MongoDB is not yet installed on the VPS, execute [`scripts/cloudpanel/setup_mongodb.sh`](file:///d:/flumenx/floxa%20univerce/floxa%20work/scripts/cloudpanel/setup_mongodb.sh):

```bash
# Run safe MongoDB setup
sudo ./scripts/cloudpanel/setup_mongodb.sh
```

In `mongosh`, create the restricted application user:

```javascript
use floxa_work_prod;
db.createUser({
  user: "floxa_work_app_user",
  pwd: "<YOUR_GENERATED_32_CHAR_PASSWORD>",
  roles: [
    { role: "readWrite", db: "floxa_work_prod" }
  ]
});
```

---

## 3. Mongoose Connection String

Stored securely in `/etc/floxa/backend.env`:
```bash
MONGODB_URI="mongodb://floxa_work_app_user:<YOUR_PASSWORD>@127.0.0.1:27017/floxa_work_prod?authSource=floxa_work_prod"
```

---

## 4. Verification Results

- **Service Status:** Managed via systemd `systemctl status mongod`.
- **Readiness Probe:** Express `/health/ready` confirms database connectivity with `status: ready` and 0ms ping latency.
- **Auto-Indexes:** Mongoose auto-indexes (`users.email` unique, `talentprofiles` compound rating/hourlyRate/skills) active.
