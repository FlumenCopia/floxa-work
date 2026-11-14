#!/usr/bin/env bash
# ==============================================================================
# FLOXA WORK — SCRIPT 02: NODE.JS 20 LTS & MONGODB COMMUNITY INSTALLATION
# Target: Ubuntu 22.04 LTS / 24.04 LTS
# Run as: root (or sudo)
# ==============================================================================

set -euo pipefail

echo "===================================================================="
echo "  FLOXA WORK — RUNTIME & MONGODB INSTALLATION"
echo "===================================================================="

# 1. Install Node.js 20 LTS via NodeSource
echo "[1/4] Installing Node.js 20 LTS runtime..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v
npm -v

# 2. Install MongoDB 7.0 Community Edition
echo "[2/4] Adding MongoDB 7.0 Community repository..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes

UBUNTU_CODENAME=$(lsb_release -cs)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/7.0 multiverse" | \
   tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt-get update -y
apt-get install -y mongodb-org mongodb-org-tools

# 3. Configure MongoDB Bind Address (Localhost 127.0.0.1 ONLY)
echo "[3/4] Hardening MongoDB network configuration..."
sed -i 's/bindIp: .*/bindIp: 127.0.0.1/' /etc/mongod.conf
systemctl enable mongod
systemctl restart mongod

# 4. Install Nginx and Certbot
echo "[4/4] Installing Nginx and Certbot..."
apt-get install -y nginx certbot python3-certbot-nginx
systemctl enable nginx
systemctl start nginx

echo "===================================================================="
echo "  [SUCCESS] Node.js, MongoDB, and Nginx successfully installed."
echo "===================================================================="
