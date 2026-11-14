# FLOXA WORK — PHASE 21 MONGODB SELF-HOSTED INSTALLATION GUIDE

**Database Engine:** MongoDB 7.0 Community Edition  
**Operating System:** Ubuntu 22.04 LTS / 24.04 LTS  
**Process Manager:** systemd (`mongod.service`)  
**Network Binding:** `127.0.0.1` (Localhost Loopback Only)  

---

## 1. Installation Protocol

### 1.1 Add MongoDB GPG Key & Official Repository
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes

UBUNTU_CODENAME=$(lsb_release -cs)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/7.0 multiverse" | \
   tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt-get update -y
apt-get install -y mongodb-org mongodb-org-tools
```

### 1.2 Configuration Hardening (`/etc/mongod.conf`)
Open `/etc/mongod.conf` and verify the network and security blocks:

```yaml
# Network interfaces (LOCAL BINDING ONLY)
net:
  port: 27017
  bindIp: 127.0.0.1

# Security and Authentication
security:
  authorization: enabled

# Storage Engine (WiredTiger)
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1
```

> [!IMPORTANT]
> **Cache Sizing for VPS:**  
> In `/etc/mongod.conf`, setting `cacheSizeGB: 1` explicitly limits MongoDB's internal WiredTiger cache to 1 GB, preventing memory starvation of Next.js and Node.js on a 2 GB or 4 GB VPS.

### 1.3 Service Activation
```bash
systemctl daemon-reload
systemctl enable mongod
systemctl restart mongod

# Verify status
systemctl status mongod
```
