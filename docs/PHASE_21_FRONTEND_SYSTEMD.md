# FLOXA WORK — PHASE 21 FRONTEND SYSTEMD UNIT SPECIFICATION

**Service Unit File:** `/etc/systemd/system/floxa-frontend.service`  
**Service User:** `floxa` (Non-Root)  
**Process Command:** `/usr/bin/npm run start -- -p 3001 -H 127.0.0.1`  

---

## 1. Systemd Service Unit Content

```ini
[Unit]
Description=FLOXA Work Next.js 16 Production Frontend
After=network.target floxa-backend.service

[Service]
Type=simple
User=floxa
Group=floxa
WorkingDirectory=/var/www/floxa-work/frontend
EnvironmentFile=/etc/floxa/frontend.env
ExecStart=/usr/bin/npm run start -- -p 3001 -H 127.0.0.1
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=floxa-frontend

# Security Sandboxing & Hardening
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
PrivateTmp=true
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

---

## 2. Hardening & Port Binding Directives

1. `-H 127.0.0.1`: Explicitly binds Next.js to the internal loopback adapter. External web traffic can only reach the frontend via the Nginx reverse proxy.
2. `-p 3001`: Directs Next.js to listen on port 3001.
3. `After=floxa-backend.service`: Ensures the API is running before the frontend starts serving user traffic.
4. `Restart=always`: Automatically recovers the Node.js process if an uncaught exception terminates the server.

---

## 3. Maintenance Commands

```bash
# Reload daemon after changes
sudo systemctl daemon-reload

# Restart frontend
sudo systemctl restart floxa-frontend

# View live output logs
sudo journalctl -u floxa-frontend -f -n 100
```
