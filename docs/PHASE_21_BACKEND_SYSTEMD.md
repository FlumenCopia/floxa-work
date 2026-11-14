# FLOXA WORK — PHASE 21 BACKEND SYSTEMD UNIT SPECIFICATION

**Service Unit File:** `/etc/systemd/system/floxa-backend.service`  
**Service User:** `floxa` (Non-Root)  
**Process Command:** `/usr/bin/node dist/server.js`  

---

## 1. Systemd Service Unit Content

```ini
[Unit]
Description=FLOXA Work Backend API & WebSocket Engine
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=floxa
Group=floxa
WorkingDirectory=/var/www/floxa-work/backend
EnvironmentFile=/etc/floxa/backend.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=floxa-backend

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

## 2. Hardening Directives Explained

1. `After=mongod.service` & `Wants=mongod.service`: Guarantees MongoDB starts before the backend process attempts connection.
2. `Restart=always` & `RestartSec=5`: Ensures the backend automatically restarts within 5 seconds if an uncaught exception occurs.
3. `NoNewPrivileges=true`: Prevents the process from gaining elevated privileges via `setuid` or `sudo`.
4. `ProtectSystem=full`: Mounts `/usr`, `/boot`, and `/etc` as read-only for this process.
5. `ProtectHome=true`: Restricts access to `/home`, `/root`, and `/run/user`.
6. `LimitNOFILE=65535`: Raises file descriptor limits to allow up to 65,535 concurrent WebSocket and HTTP connections.

---

## 3. Maintenance & Log Inspection

```bash
# Reload systemd daemon after changes
sudo systemctl daemon-reload

# Restart backend process
sudo systemctl restart floxa-backend

# Follow live output logs
sudo journalctl -u floxa-backend -f -n 100

# View logs since last boot
sudo journalctl -u floxa-backend -b
```
