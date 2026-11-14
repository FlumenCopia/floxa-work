#!/usr/bin/env bash
# ==============================================================================
# FLOXA WORK — CLOUDPANEL ZERO-DISRUPTION DEPLOYMENT RUNNER
# Target Server: Hostinger Ubuntu VPS (IP: 89.116.121.25)
# Environment: CloudPanel Multi-Tenant VPS
# Scope: Strictly isolated to user 'floxa' and dedicated ports
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "===================================================================="
echo "  FLOXA WORK — CLOUDPANEL SAFE DEPLOYMENT RUNNER"
echo "  Target User: floxa | Isolation Root: /home/floxa/"
echo "===================================================================="

# SAFETY CHECK: Ensure we never touch other site directories
DEPLOY_USER="floxa"
DEPLOY_ROOT="/home/${DEPLOY_USER}/htdocs/floxa-work"
VAULT_ROOT="/home/${DEPLOY_USER}/private_vault"
BACKUP_ROOT="/home/${DEPLOY_USER}/backups/floxa-app"

echo "[1/6] Verifying user isolation and directories..."
if ! id "${DEPLOY_USER}" &>/dev/null; then
    echo "Creating isolated system user '${DEPLOY_USER}'..."
    useradd -m -d "/home/${DEPLOY_USER}" -s /bin/bash "${DEPLOY_USER}"
else
    # Ensure login shell is enabled for SSH access if needed
    usermod -s /bin/bash "${DEPLOY_USER}"
fi

mkdir -p "${DEPLOY_ROOT}"
mkdir -p "${VAULT_ROOT}"
mkdir -p "${BACKUP_ROOT}"
mkdir -p "/etc/floxa"

chmod 700 "${VAULT_ROOT}"
chmod 700 "${BACKUP_ROOT}"
chmod 750 "/etc/floxa"

# 2. Dynamic Port Conflict Detection (Guarantees zero collision with existing sites)
echo "[2/6] Verifying available ports (dynamic collision avoidance)..."

is_port_in_use_by_other() {
    local port="$1"
    if ss -tulpn | grep -q ":${port} "; then
        local pid
        pid=$(ss -tulpn | grep ":${port} " | grep -o 'pid=[0-9]*' | head -n1 | cut -d'=' -f2 || true)
        if [ -n "$pid" ]; then
            local proc_user
            proc_user=$(ps -o user= -p "$pid" 2>/dev/null | tr -d ' ' || true)
            if [ "$proc_user" != "${DEPLOY_USER}" ] && [ -n "$proc_user" ]; then
                return 0 # In use by another tenant
            fi
        else
            return 0 # In use by unknown process
        fi
    fi
    return 1 # Available or owned by floxa
}

find_safe_port() {
    local candidate="$1"
    local label="$2"
    while is_port_in_use_by_other "$candidate"; do
        echo "  [PORT COLLISION GUARD] Port ${candidate} is in use by another website/service."
        echo "  --> Testing next available port for ${label}..."
        candidate=$((candidate + 1))
    done
    echo "$candidate"
}

SAFE_BACKEND_PORT=$(find_safe_port 5001 "FLOXA Backend")
SAFE_FRONTEND_PORT=$(find_safe_port 3001 "FLOXA Frontend")

echo "  -> Selected Backend Port:  ${SAFE_BACKEND_PORT}"
echo "  -> Selected Frontend Port: ${SAFE_FRONTEND_PORT}"

# 3. Setup Secure Environment Config Files
echo "[3/6] Setting up isolated environment in /etc/floxa..."
if [ ! -f /etc/floxa/backend.env ]; then
    cat << EOF > /etc/floxa/backend.env
NODE_ENV=production
PORT=${SAFE_BACKEND_PORT}
DATABASE_URL=mongodb://floxa_work_app_user:REPLACE_WITH_STRONG_PASSWORD@127.0.0.1:27017/floxa_work_prod?authSource=floxa_work_prod
MONGODB_URI=mongodb://floxa_work_app_user:REPLACE_WITH_STRONG_PASSWORD@127.0.0.1:27017/floxa_work_prod?authSource=floxa_work_prod
JWT_ACCESS_SECRET=REPLACE_WITH_64_CHAR_HEX
JWT_REFRESH_SECRET=REPLACE_WITH_64_CHAR_HEX
CORS_ORIGIN=https://work.flumenx.in,https://floxawork.flumenx.in,https://work-app.flumenx.in,https://app.floxa.work
TRUST_PROXY=true
STORAGE_PROVIDER=local
STORAGE_LOCAL_ROOT=/home/floxa/private_vault
MEDIA_ROOT=media
EMAIL_PROVIDER=log
EOF
else
    # Update port if config already exists
    sed -i "s/^PORT=.*/PORT=${SAFE_BACKEND_PORT}/" /etc/floxa/backend.env
fi

if [ ! -f /etc/floxa/frontend.env ]; then
    cat << EOF > /etc/floxa/frontend.env
NODE_ENV=production
PORT=${SAFE_FRONTEND_PORT}
NEXT_PUBLIC_API_URL=https://api-work.flumenx.in/api
NEXT_PUBLIC_WS_URL=wss://api-work.flumenx.in/ws
EOF
else
    sed -i "s/^PORT=.*/PORT=${SAFE_FRONTEND_PORT}/" /etc/floxa/frontend.env
fi

chown -R ${DEPLOY_USER}:${DEPLOY_USER} /etc/floxa
chmod 600 /etc/floxa/backend.env
chmod 644 /etc/floxa/frontend.env

# 4. Compile Backend
echo "[4/6] Building Backend application..."
if [ -d "${DEPLOY_ROOT}/backend" ]; then
    cd "${DEPLOY_ROOT}/backend"
    npm install --production=false
    npm run build
fi

# 5. Compile Frontend
echo "[5/6] Building Frontend application..."
if [ -d "${DEPLOY_ROOT}/frontend" ]; then
    cd "${DEPLOY_ROOT}/frontend"
    npm install --production=false
    npm run build
fi

# 6. Service Units Registration
echo "[6/6] Registering isolated systemd units..."

# Backend Service
cat << EOF > /etc/systemd/system/floxa-backend.service
[Unit]
Description=FLOXA Work Backend API & WebSocket Engine (CloudPanel)
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=${DEPLOY_USER}
Group=${DEPLOY_USER}
WorkingDirectory=${DEPLOY_ROOT}/backend
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
ProtectHome=false
ReadWritePaths=${VAULT_ROOT} ${DEPLOY_ROOT}/backend
PrivateTmp=true
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

# Frontend Service
cat << EOF > /etc/systemd/system/floxa-frontend.service
[Unit]
Description=FLOXA Work Next.js 16 Production Frontend (CloudPanel)
After=network.target floxa-backend.service

[Service]
Type=simple
User=${DEPLOY_USER}
Group=${DEPLOY_USER}
WorkingDirectory=${DEPLOY_ROOT}/frontend
EnvironmentFile=/etc/floxa/frontend.env
ExecStart=/usr/bin/npm run start -- -p ${SAFE_FRONTEND_PORT} -H 127.0.0.1
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=floxa-frontend

# Security Sandboxing & Hardening
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=false
ReadWritePaths=${DEPLOY_ROOT}/frontend
PrivateTmp=true
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

echo "===================================================================="
echo "  [SUCCESS] Deployment script finished safely!"
echo "  - Existing sites under /home/ were NOT modified or disturbed."
echo "  - MySQL / MariaDB databases were NOT touched."
echo "  - Selected Backend Port:  ${SAFE_BACKEND_PORT} -> http://127.0.0.1:${SAFE_BACKEND_PORT}"
echo "  - Selected Frontend Port: ${SAFE_FRONTEND_PORT} -> http://127.0.0.1:${SAFE_FRONTEND_PORT}"
echo "===================================================================="
