# FLOXA WORK — MASTER DEPLOYMENT FRONTEND REPORT

**Service Name:** `floxa-frontend.service`  
**Framework:** Next.js 16.2.10 (Turbopack Engine)  
**Internal Port:** `127.0.0.1:3001`  
**Public Endpoint:** `https://app.floxa.work`  

---

## 1. Frontend Build & Process Configuration

### 1.1 Compilation
```bash
cd /home/floxa/htdocs/floxa-work/frontend
npm install
npm run build
# Compiles Next.js optimized SSR pages and client chunks in .next/
```

### 1.2 Systemd Process Management (`/etc/systemd/system/floxa-frontend.service`)
```ini
[Unit]
Description=FLOXA Work Next.js 16 Production Frontend
After=network.target floxa-backend.service

[Service]
Type=simple
User=floxa
Group=floxa
WorkingDirectory=/home/floxa/htdocs/floxa-work/frontend
EnvironmentFile=/etc/floxa/frontend.env
ExecStart=/usr/bin/npm run start -- -p 3001 -H 127.0.0.1
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=floxa-frontend

# Security Sandboxing
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
PrivateTmp=true
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

---

## 2. Zero-Localhost Fallback Audit

In Phase 19, `frontend/lib/api.ts` and `frontend/app/page.tsx` were audited and hardened. If `NEXT_PUBLIC_API_URL` is omitted, the browser defaults to relative `/api` paths routed through Nginx instead of making broken calls to `localhost:5001`.
