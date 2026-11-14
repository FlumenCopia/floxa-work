# FLOXA WORK — MASTER DEPLOYMENT BACKEND REPORT

**Service Name:** `floxa-backend.service`  
**Runtime:** Node.js 20 LTS / Express 4.x / `ws` 8.18  
**Internal Port:** `127.0.0.1:5001`  
**Public Endpoint:** `https://api.floxa.work`  
**WebSocket Endpoint:** `wss://api.floxa.work/ws`  

---

## 1. Backend Build & Process Configuration

### 1.1 Compilation
```bash
cd /home/floxa/htdocs/floxa-work/backend
npm install
npm run build
# Compiles cleanly to ES Modules in dist/
```

### 1.2 Systemd Process Management (`/etc/systemd/system/floxa-backend.service`)
```ini
[Unit]
Description=FLOXA Work Backend API & WebSocket Engine
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=floxa
Group=floxa
WorkingDirectory=/home/floxa/htdocs/floxa-work/backend
EnvironmentFile=/etc/floxa/backend.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=floxa-backend

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

## 2. Health & Readiness Verification

- **Liveness Probe:** `GET http://127.0.0.1:5001/health/live` -> `200 OK` (`{"status":"ok","service":"floxa-work-backend"}`).
- **Readiness Probe:** `GET http://127.0.0.1:5001/health/ready` -> `200 OK` (`{"status":"ready","database":{"status":"connected"}}`).
- **WebSocket Handshake:** `GET http://127.0.0.1:5001/ws` -> HTTP 101 Switching Protocols with 30s heartbeat keepalive.
- **Fail-Fast Protection:** In production mode, process halts immediately if `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET` are missing or weak (<32 characters).
