#!/usr/bin/env bash
# ==============================================================================
# FLOXA WORK — SCRIPT 01: HOSTINGER VPS INITIAL HARDENING & BASE PACKAGES
# Target: Ubuntu 22.04 LTS / 24.04 LTS
# Run as: root (or sudo)
# ==============================================================================

set -euo pipefail

echo "===================================================================="
echo "  FLOXA WORK — VPS HARDENING INITIALIZATION"
echo "===================================================================="

# 1. Update and Upgrade System Packages
echo "[1/6] Updating system repositories and upgrading packages..."
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
apt-get install -y ufw curl wget gnupg git build-essential unattended-upgrades fail2ban ca-certificates

# 2. Configure Unattended Security Upgrades
echo "[2/6] Enabling automated security patches..."
dpkg-reconfigure -f noninteractive unattended-upgrades

# 3. Create Dedicated Non-Root Application User
echo "[3/6] Creating service user 'floxa'..."
if id "floxa" &>/dev/null; then
    echo "User 'floxa' already exists."
else
    useradd -m -s /bin/bash -c "FLOXA Work Service Operator" floxa
    usermod -aG sudo floxa
    echo "User 'floxa' created and granted sudo privileges."
fi

# 4. Configure UFW Firewall (SSH, HTTP 80, HTTPS 443 only)
echo "[4/6] Configuring UFW Firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH Remote Management'
ufw allow 80/tcp comment 'Nginx HTTP / ACME Challenge'
ufw allow 443/tcp comment 'Nginx HTTPS Encrypted'
# Explicitly confirm MongoDB 27017, 3001, 5001 are NOT exposed
echo "y" | ufw enable
ufw status verbose

# 5. Configure Fail2ban for SSH Protection
echo "[5/6] Starting fail2ban service..."
systemctl enable fail2ban
systemctl restart fail2ban

# 6. Create Base Directories
echo "[6/6] Creating deployment root directories..."
mkdir -p /var/www/floxa-work
mkdir -p /var/lib/floxa-work/private_vault
mkdir -p /etc/floxa
chown -R floxa:floxa /var/www/floxa-work
chown -R floxa:floxa /var/lib/floxa-work
chmod 700 /var/lib/floxa-work/private_vault
chmod 750 /etc/floxa

echo "===================================================================="
echo "  [SUCCESS] Server hardening completed. Proceed to Script 02."
echo "===================================================================="
