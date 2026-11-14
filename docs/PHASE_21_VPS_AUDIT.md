# FLOXA WORK — PHASE 21 HOSTINGER VPS CONNECTIVITY & ACCESS AUDIT

**Audit Date:** November 14, 2026  
**Auditor:** Antigravity Autonomous Infrastructure & Deployment Harness  
**Target Platform:** Hostinger Ubuntu VPS (Self-Hosted Architecture)  
**Baseline Git Checkpoint:** `3fde46b`  

---

## 1. Execution Environment & VPS Connectivity Assessment

In accordance with Phase 21 instructions:
1. The execution environment checked for active SSH credentials, network tunnels, and Hostinger VPS IP address.
2. The environment is isolated from host system SSH directories (`~/.ssh`) and has not been supplied with a public IP address or SSH credentials.
3. In strict compliance with security rules, the operator is **never asked to paste root passwords, private keys, or SSH credentials** into chat or repository files.

### Audit Checklist:
- **VPS Public IP Availability:** Awaiting operator input (e.g. Hostinger hPanel > VPS dashboard).
- **SSH Access Method:** Hostinger Browser Web Terminal or secure SSH key pair.
- **Ubuntu Version:** Target Ubuntu 22.04 LTS or 24.04 LTS (Standard Hostinger VPS templates).
- **Execution Capability:** Direct automated remote commands are **BLOCKED**. Complete, self-contained shell automation scripts have been provisioned in `scripts/vps/` for immediate operator execution via Hostinger VPS terminal.

---

## 2. Server Inspection Commands for the Operator

When the operator accesses the Hostinger VPS terminal via hPanel, run the following inspection commands to confirm the baseline server state:

```bash
# 1. Check OS and Kernel Version
lsb_release -a
uname -r

# 2. Check CPU Cores and Hardware Architecture
lscpu | grep -E "Model name|CPU\(s\):|Thread"

# 3. Check Memory (RAM & Swap)
free -h

# 4. Check Disk Space & Filesystem Mounting
df -h /

# 5. Check Active Listening Ports
ss -tulpn

# 6. Check Active Firewall (UFW) Status
ufw status verbose
```

---

## 3. Hostinger VPS Baseline Requirements

| Metric | Minimum Required for Beta | Recommended for Production Beta | Notes |
| :--- | :--- | :--- | :--- |
| **Operating System** | Ubuntu 22.04 LTS | Ubuntu 22.04 / 24.04 LTS | Clean minimal OS template |
| **CPU** | 1 vCPU | 2 vCPU | Node.js and MongoDB concurrency |
| **RAM** | 2.0 GB | 4.0 GB | MongoDB cache + Node + Next.js build |
| **Disk Space** | 20 GB SSD | 40+ GB NVMe SSD | System, Node dependencies, private vault |
| **Network Egress** | 1 Gbps Shared | 1 Gbps Dedicated | Unthrottled WebSocket collaboration |

---

## 4. Subsystem Verdict

- **Automated Remote Execution:** `BLOCKED (Operator Hostinger Terminal Execution Required)`
- **Server Preparation Scripts:** `READY (scripts/vps/01_harden_server.sh)`
