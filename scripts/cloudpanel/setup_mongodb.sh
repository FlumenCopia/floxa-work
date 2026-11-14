#!/usr/bin/env bash
# ==============================================================================
# FLOXA WORK — SAFE MONGODB INSTALLATION & USER CREATION FOR CLOUDPANEL VPS
# Scope: Preserves existing MySQL/MariaDB services and databases
# Binding: 127.0.0.1 (Localhost only) | Port: 27017
# ==============================================================================

set -euo pipefail

echo "===================================================================="
echo "  FLOXA WORK — SAFE MONGODB 7.0 INSTALLATION (SHARED VPS SAFE)"
echo "===================================================================="

# Check if MongoDB is already installed and running
if systemctl is-active --quiet mongod 2>/dev/null; then
    echo "[INFO] MongoDB is already installed and running. Preserving existing instance without restart."
    echo "[INFO] Verifying localhost port 27017..."
    if ss -tulpn | grep -q ":27017 "; then
        echo "[OK] MongoDB is listening on port 27017."
    fi
else
    echo "[1/4] Installing MongoDB 7.0 Community Server..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
       gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes

    UBUNTU_CODENAME=$(lsb_release -cs)
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/7.0 multiverse" | \
       tee /etc/apt/sources.list.d/mongodb-org-7.0.list

    apt-get update -y
    apt-get install -y mongodb-org mongodb-org-tools

    # Hardening /etc/mongod.conf (127.0.0.1 ONLY, WiredTiger cache limit 1GB)
    echo "[2/4] Verifying localhost binding and cache limits in /etc/mongod.conf..."
    sed -i 's/bindIp: .*/bindIp: 127.0.0.1/' /etc/mongod.conf

    # Check cache limit to prevent memory contention with MySQL/PHP
    if ! grep -q "cacheSizeGB" /etc/mongod.conf; then
        cat << 'EOF' >> /etc/mongod.conf

storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1
EOF
    fi

    systemctl enable mongod
    systemctl restart mongod
fi

# Prompt operator to create isolated user
echo "[3/4] Ready to create dedicated user 'floxa_work_app_user' for 'floxa_work_prod'..."
echo "Run the following in mongosh to create the dedicated database user:"
cat << 'EOF'
use floxa_work_prod;
db.createUser({
  user: "floxa_work_app_user",
  pwd: "<YOUR_GENERATED_32_CHAR_PASSWORD>",
  roles: [ { role: "readWrite", db: "floxa_work_prod" } ]
});
EOF

echo "[4/4] MongoDB setup completed. Existing MySQL/MariaDB databases untouched."
