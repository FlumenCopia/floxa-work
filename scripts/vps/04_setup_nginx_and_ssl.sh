#!/usr/bin/env bash
# ==============================================================================
# FLOXA WORK — SCRIPT 04: NGINX PROXY & LET'S ENCRYPT SSL DEPLOYMENT
# Target: Ubuntu 22.04 LTS / 24.04 LTS
# Run as: root (or sudo)
# ==============================================================================

set -euo pipefail

echo "===================================================================="
echo "  FLOXA WORK — NGINX & HTTPS CONFIGURATION"
echo "===================================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Install Nginx Site Configuration
echo "[1/3] Deploying Nginx site configuration..."
cp "${SCRIPT_DIR}/floxa-work.nginx.conf" /etc/nginx/sites-available/floxa-work
ln -sf /etc/nginx/sites-available/floxa-work /etc/nginx/sites-enabled/floxa-work

# Remove default site if present
rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
nginx -t
systemctl reload nginx

# 2. Automated Let's Encrypt Certificate Request
echo "[2/3] Checking DNS resolution before requesting SSL..."
echo "Ensure app.floxa.work and api.floxa.work A-records point to this VPS IP!"

read -p "Would you like to request Let's Encrypt SSL now? (y/N): " -r CONFIRM || CONFIRM="n"
if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
    read -p "Enter operator notification email (for expiry alerts): " OPERATOR_EMAIL
    certbot --nginx -d app.floxa.work -d api.floxa.work --non-interactive --agree-tos -m "$OPERATOR_EMAIL" --redirect
    echo "[SUCCESS] SSL certificates issued and Nginx reloaded."
else
    echo "[INFO] Skipping SSL setup. HTTP is currently active on port 80."
fi

# 3. Verify Certbot Auto-Renewal Timer
echo "[3/3] Verifying Certbot auto-renewal timer..."
systemctl list-timers | grep certbot || true

echo "===================================================================="
echo "  [SUCCESS] Nginx configuration deployed."
echo "===================================================================="
