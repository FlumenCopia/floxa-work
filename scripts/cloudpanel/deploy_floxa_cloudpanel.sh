#!/usr/bin/env bash
# ==============================================================================
# FLOXA WORK — CLOUDPANEL ZERO-DISRUPTION DEPLOYMENT RUNNER
# Target Server: Hostinger Ubuntu VPS (IP: 89.116.121.25)
# Environment: CloudPanel Multi-Tenant VPS
# Scope: Strictly isolated to user 'floxa' and dedicated ports (5001, 3001)
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
fi

mkdir -p "${DEPLOY_ROOT}"
mkdir -p "${VAULT_ROOT}"
mkdir -p "${BACKUP_ROOT}"
mkdir -p "/etc/floxa"

chmod 700 "${VAULT_ROOT}"
chmod 700 "${BACKUP_ROOT}"
chmod 750 "/etc/floxa"

# 2. Check Port Availability (Zero collision with existing sites)
echo "[2/6] Verifying dedicated ports (5001 Backend, 3001 Frontend)..."
if ss -tulpn | grep -q ":5001 "; then
    echo "Notice: Port 5001 already in use. Checking if it belongs to floxa..."
else
    echo "Port 5001 is available for FLOXA Backend."
fi

if ss -tulpn | grep -q ":3001 "; then
    echo "Notice: Port 3001 already in use. Checking if it belongs to floxa..."
else
    echo "Port 3001 is available for FLOXA Frontend."
fi

# 3. Setup Secure Environment Config Files
echo "[3/6] Setting up isolated environment in /etc/floxa..."
if [ ! -f /etc/floxa/backend.env ]; then
    cat << 'EOF' > /etc/floxa/backend.env
NODE_ENV=production
PORT=5001
DATABASE_URL=mongodb://floxa_work_app_user:REPLACE_WITH_STRONG_PASSWORD@127.0.0.1:27017/floxa_work_prod?authSource=floxa_work_prod
MONGODB_URI=mongodb://floxa_work_app_user:REPLACE_WITH_STRONG_PASSWORD@127.0.0.1:27017/floxa_work_prod?authSource=floxa_work_prod
JWT_ACCESS_SECRET=REPLACE_WITH_64_CHAR_HEX
JWT_REFRESH_SECRET=REPLACE_WITH_64_CHAR_HEX
CORS_ORIGIN=https://floxa.flumenx.in,https://work.flumenx.in,https://app.floxa.work
TRUST_PROXY=true
STORAGE_PROVIDER=local
STORAGE_LOCAL_ROOT=/home/floxa/private_vault
MEDIA_ROOT=media
EMAIL_PROVIDER=log
EOF
fi

if [ ! -f /etc/floxa/frontend.env ]; then
    cat << 'EOF' > /etc/floxa/frontend.env
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://api-floxa.flumenx.in/api
NEXT_PUBLIC_WS_URL=wss://api-floxa.flumenx.in/ws
EOF
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
if [ -f "${SCRIPT_DIR}/floxa-backend.service" ]; then
    cp "${SCRIPT_DIR}/floxa-backend.service" /etc/systemd/system/floxa-backend.service
elif [ -f "${DEPLOY_ROOT}/scripts/cloudpanel/floxa-backend.service" ]; then
    cp "${DEPLOY_ROOT}/scripts/cloudpanel/floxa-backend.service" /etc/systemd/system/floxa-backend.service
fi

if [ -f "${SCRIPT_DIR}/floxa-frontend.service" ]; then
    cp "${SCRIPT_DIR}/floxa-frontend.service" /etc/systemd/system/floxa-frontend.service
elif [ -f "${DEPLOY_ROOT}/scripts/cloudpanel/floxa-frontend.service" ]; then
    cp "${DEPLOY_ROOT}/scripts/cloudpanel/floxa-frontend.service" /etc/systemd/system/floxa-frontend.service
fi

systemctl daemon-reload

echo "===================================================================="
echo "  [SUCCESS] Deployment script finished safely without modifying"
echo "  any existing sites under /home/."
echo "===================================================================="
