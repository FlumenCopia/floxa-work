# FLOXA WORK — PHASE 21 UBUNTU SERVER HARDENING RUNBOOK

**Target Environment:** Hostinger VPS (Ubuntu 22.04 LTS / 24.04 LTS)  
**Execution Script:** `scripts/vps/01_harden_server.sh`  
**Security Standard:** CIS Ubuntu Linux Benchmark / Defense-in-Depth  

---

## 1. Hardening Objectives & Invariants

Self-hosting a production freelance marketplace requires robust operating system hardening:
1. **Never Lock Out the Operator:** The existing SSH session and root access path must remain intact throughout all configuration steps.
2. **Dedicated Least-Privilege User:** Applications and services run under a dedicated unprivileged user (`floxa`).
3. **Strict Network Perimeter:** Inbound connections are strictly restricted to ports **22 (SSH)**, **80 (HTTP)**, and **443 (HTTPS)**.
4. **Zero Public Database Exposure:** MongoDB port `27017` is bound exclusively to `127.0.0.1` and blocked by UFW from any external network traffic.
5. **Intrusion Prevention:** `fail2ban` monitors unauthorized SSH brute-force attempts.
6. **Automated Kernel Patches:** `unattended-upgrades` applies critical security updates automatically.

---

## 2. Hardening Execution Steps

### 2.1 Base System Update
```bash
apt-get update -y && apt-get upgrade -y
apt-get install -y ufw curl wget gnupg git build-essential unattended-upgrades fail2ban ca-certificates
```

### 2.2 Unattended Upgrades Configuration
Configure automated security updates in `/etc/apt/apt.conf.d/50unattended-upgrades`:
```text
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::Package-Blacklist {
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
```

### 2.3 Create Service User `floxa`
```bash
useradd -m -s /bin/bash -c "FLOXA Work Service Operator" floxa
usermod -aG sudo floxa
```

### 2.4 UFW Firewall Rules
```bash
# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow required public services
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP / ACME'
ufw allow 443/tcp comment 'HTTPS'

# Enable firewall
echo "y" | ufw enable
```

### 2.5 Fail2ban SSH Jail Configuration
Create `/etc/fail2ban/jail.local`:
```ini
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
findtime = 600
bantime = 3600
```
Start and enable fail2ban:
```bash
systemctl enable fail2ban
systemctl restart fail2ban
```

---

## 3. Verification Commands

```bash
# Verify UFW status (should show 22, 80, 443 ALLOWED; 27017 NOT present)
sudo ufw status numbered

# Verify fail2ban is monitoring sshd
sudo fail2ban-client status sshd

# Verify user floxa exists and has restricted shell
id floxa
```
