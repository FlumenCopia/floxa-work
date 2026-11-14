# FLOXA WORK — PHASE 21 DEPLOYMENT BLOCKERS & REMEDIATION REGISTER

**Audit Date:** November 14, 2026  
**Auditor:** Antigravity Autonomous Infrastructure & Deployment Harness  
**Scope:** Self-Hosted Hostinger VPS Deployment  

---

## 1. Blocker Identification & Classification

| Blocker ID | Category | Severity | Description | Current Status | Remediation / Operator Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BLK-VPS-01** | Connectivity | **BLOCKER** | Direct SSH connectivity from sandbox harness to Hostinger VPS is not established (no public IP, no private key). | **DOCUMENTED / WORKAROUND READY** | In accordance with security invariants, credentials must not be passed in chat. Complete shell automation scripts provided in `scripts/vps/` for direct execution via Hostinger Browser Terminal. |
| **BLK-VPS-02** | DNS Delegation | **BLOCKER** | `app.floxa.work` and `api.floxa.work` do not yet point to the Hostinger VPS public IP. | **PENDING OPERATOR DNS** | Operator must create A-records pointing to VPS IP before Let's Encrypt SSL can be issued. |
| **BLK-VPS-03** | Server State | **BLOCKER** | The Hostinger VPS is currently blank and unprovisioned (no Node.js, MongoDB, Nginx, or systemd services). | **SCRIPTS PROVIDED** | Execution of `01_harden_server.sh` through `04_setup_nginx_and_ssl.sh` will completely provision the server. |
| **HGH-VPS-01** | RAM Ceiling | **HIGH** | If VPS has <= 2 GB RAM, `next build` may exhaust memory during compilation. | **MITIGATED** | Swap allocation instructions provided in `PHASE_21_RESOURCE_CAPACITY.md`. |
| **HGH-VPS-02** | Off-Server Backup | **HIGH** | Local VPS backups protect against software errors but not VPS physical destruction. | **MITIGATED** | Off-site backup rsync / scp instructions provided in `PHASE_21_BACKUP_STRATEGY.md`. |

---

## 2. Immediate Operator Execution Pathway

To unblock deployment, the operator executes the following steps directly in the Hostinger hPanel VPS Browser Terminal:

```bash
# Step 1: Clone repository on the VPS
sudo mkdir -p /var/www/floxa-work
sudo chown -R $USER:$USER /var/www/floxa-work
git clone https://github.com/your-org/floxa-work.git /var/www/floxa-work
cd /var/www/floxa-work

# Step 2: Make automation scripts executable
chmod +x scripts/vps/*.sh

# Step 3: Run Script 01 (Server Hardening & Base Packages)
sudo ./scripts/vps/01_harden_server.sh

# Step 4: Run Script 02 (Node.js 20 LTS & MongoDB 7.0)
sudo ./scripts/vps/02_install_runtime_and_mongo.sh

# Step 5: Run Script 03 (Systemd Units & Private Vault)
sudo ./scripts/vps/03_setup_systemd_and_vault.sh

# Step 6: Run Script 04 (Nginx Reverse Proxy & Let's Encrypt SSL)
sudo ./scripts/vps/04_setup_nginx_and_ssl.sh
```
