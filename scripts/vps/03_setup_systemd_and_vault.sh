#!/usr/bin/env bash
# ==============================================================================
# FLOXA WORK — SCRIPT 03: SYSTEMD PROCESS MANAGEMENT & PRIVATE VAULT SETUP
# Target: Ubuntu 22.04 LTS / 24.04 LTS
# Run as: root (or sudo)
# ==============================================================================

set -euo pipefail

echo "===================================================================="
echo "  FLOXA WORK — SYSTEMD PROCESS MANAGEMENT REGISTRATION"
echo "===================================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Install systemd unit files
echo "[1/4] Installing systemd service units..."
cp "${SCRIPT_DIR}/floxa-backend.service" /etc/systemd/system/floxa-backend.service
cp "${SCRIPT_DIR}/floxa-frontend.service" /etc/systemd/system/floxa-frontend.service
systemctl daemon-reload

# 2. Setup Base Environment Config Templates
echo "[2/4] Initializing secure environment files in /etc/floxa..."
mkdir -p /etc/floxa

if [ ! -f /etc/floxa/backend.env ]; then
    cat << 'EOF' > /etc/floxa/backend.env
NODE_ENV=production
PORT=5001
# Replace <PASSWORD> with the output of MongoDB user creation
MONGODB_URI=mongodb://floxa_work_app_user:<PASSWORD>@127.0.0.1:27017/floxa_work_prod?authSource=floxa_work_prod
JWT_ACCESS_SECRET=REPLACE_WITH_OUTPUT_OF_OPENSSL_RAND_HEX_32
JWT_REFRESH_SECRET=REPLACE_WITH_OUTPUT_OF_OPENSSL_RAND_HEX_32
CORS_ORIGIN=https://app.floxa.work
TRUST_PROXY=true
STORAGE_PROVIDER=local
STORAGE_LOCAL_ROOT=/var/lib/floxa-work/private_vault
MEDIA_ROOT=media
EMAIL_PROVIDER=log
EOF
fi

if [ ! -f /etc/floxa/frontend.env ]; then
    cat << 'EOF' > /etc/floxa/frontend.env
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://api.floxa.work/api
NEXT_PUBLIC_WS_URL=wss://api.floxa.work/ws
EOF
fi

chown -R floxa:floxa /etc/floxa
chmod 600 /etc/floxa/backend.env
chmod 644 /etc/floxa/frontend.env

# 3. Ensure Private Vault Permissions
echo "[3/4] Securing private vault directory..."
mkdir -p /var/lib/floxa-work/private_vault
chown -R floxa:floxa /var/lib/floxa-work
chmod 700 /var/lib/floxa-work/private_vault

# 4. Enable Services to Start on Boot
echo "[4/4] Enabling systemd auto-start on boot..."
systemctl enable floxa-backend
systemctl enable floxa-frontend

echo "===================================================================="
echo "  [SUCCESS] systemd units registered and environment secured."
echo "===================================================================="
