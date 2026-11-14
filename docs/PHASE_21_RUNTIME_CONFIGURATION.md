# FLOXA WORK — PHASE 21 RUNTIME & DIRECTORY ARCHITECTURE

**Target System:** Hostinger Ubuntu VPS  
**Runtime:** Node.js 20 LTS (Active Long Term Support) / npm 10+  
**Execution Script:** `scripts/vps/02_install_runtime_and_mongo.sh`  

---

## 1. Directory Structure on VPS

```text
/var/www/floxa-work/
├── backend/                  # Express REST API & WebSocket Server
│   ├── dist/                 # Compiled JavaScript output
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Next.js 16.2 Turbopack Application
│   ├── .next/                # Production standalone/SSR build
│   ├── app/
│   ├── components/
│   └── package.json
├── scripts/
│   └── vps/                  # VPS automation & systemd scripts
/etc/floxa/                   # Production Environment Files (Protected 600)
│   ├── backend.env           # Secrets for Express backend
│   └── frontend.env          # Public API/WS URLs for frontend
/var/lib/floxa-work/          # Persistent Storage Data
│   └── private_vault/        # Private deliverables & receipts (Protected 700)
/var/backups/floxa-work/      # Automated Database & Vault Archives
```

---

## 2. Node.js Installation Procedure

Node.js 20 LTS is installed from NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs build-essential

# Verify versions
node -v   # Expected: v20.x
npm -v    # Expected: 10.x
```

---

## 3. Environment Variable Security & Permissions

> [!CAUTION]
> **No Plaintext Secrets in Repository or Public Web Roots:**  
> Environment variables must **never** be placed inside `/var/www/floxa-work/backend/.env` or tracked in git.  
> They are stored exclusively in `/etc/floxa/backend.env` with owner `floxa:floxa` and permissions `chmod 600`.

### `/etc/floxa/backend.env` (Restricted Permissions 600)
```ini
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://floxa_work_app_user:<GENERATED_PASSWORD>@127.0.0.1:27017/floxa_work_prod?authSource=floxa_work_prod
JWT_ACCESS_SECRET=<64-char cryptographically random hex>
JWT_REFRESH_SECRET=<64-char cryptographically random hex>
CORS_ORIGIN=https://app.floxa.work
TRUST_PROXY=true
STORAGE_PROVIDER=local
STORAGE_LOCAL_ROOT=/var/lib/floxa-work/private_vault
MEDIA_ROOT=media
EMAIL_PROVIDER=log
```

### `/etc/floxa/frontend.env` (Permissions 644)
```ini
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://api.floxa.work/api
NEXT_PUBLIC_WS_URL=wss://api.floxa.work/ws
```
