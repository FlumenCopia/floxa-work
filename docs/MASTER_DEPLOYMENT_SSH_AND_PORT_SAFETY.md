# FLOXA WORK — SSH SETUP & PORT SAFETY RUNBOOK

**Target VPS:** Hostinger Ubuntu VPS (`89.116.121.25`) with CloudPanel  
**Shared Production Tenants:** `/home/flumenx/` (including `floxa.flumenx.in` Floxa Design), `/home/foresight/`, `/home/rwen-interiors/`, `/home/susrutha/`, `/home/miscarchive/`  
**Deployment User:** `floxa` (`/home/floxa/`)  

---

## 1. SAFE SSH SETUP FOR USER `floxa`

### Absolute Rule: Zero Global SSH Alteration
To protect all existing websites and administrative access:
- **Do NOT edit** `/etc/ssh/sshd_config`.
- **Do NOT change** the default SSH port (`22`).
- **Do NOT restart** the global `sshd` daemon.
- **Do NOT alter** firewall / UFW rules.

### How User `floxa` SSH is Configured in 100% Isolation
All SSH authentication for user `floxa` is handled entirely within `/home/floxa/.ssh/authorized_keys`.

#### Option A: Using the Automated Safe Script
On the VPS as `root`:
```bash
cd /home/floxa/htdocs/floxa-work/scripts/cloudpanel

# Add your local SSH public key (e.g. id_ed25519.pub or id_rsa.pub)
bash setup_ssh_floxa.sh "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... operator@flumenx"
```

#### Option B: Through CloudPanel Web Interface
1. Log in to CloudPanel: `https://89.116.121.25:8443`.
2. Go to **Users** in the left sidebar.
3. Find or click user **`floxa`**.
4. Click the **SSH Keys** tab.
5. Click **Add SSH Key** &rarr; Paste your public key &rarr; Click **Save**.

#### Option C: Manual Terminal Command
```bash
# Ensure directory exists with POSIX mode 700
mkdir -p /home/floxa/.ssh
chmod 700 /home/floxa/.ssh

# Append your public key
echo "YOUR_PUBLIC_KEY_HERE" >> /home/floxa/.ssh/authorized_keys

# Set strict permissions
chmod 600 /home/floxa/.ssh/authorized_keys
chown -R floxa:floxa /home/floxa/.ssh
```

### Connecting to the VPS as `floxa`
From your local terminal:
```bash
ssh floxa@89.116.121.25
```

---

## 2. PORT COLLISION AVOIDANCE & DYNAMIC PROBING

The VPS hosts active Node.js backends (`flumenx-api-rwen`, `flumenx-api-susrutha`, `flumenx-api-erp`, etc.).  
To guarantee that FLOXA Work never takes over a port belonging to an existing website, [`deploy_floxa_cloudpanel.sh`](file:///d:/flumenx/floxa%20univerce/floxa%20work/scripts/cloudpanel/deploy_floxa_cloudpanel.sh) includes an **intelligent dynamic port probe**.

### How Port Collision Avoidance Works:
1. The script probes default ports:
   - **Backend Candidate:** `5001`
   - **Frontend Candidate:** `3001`
2. It inspects `ss -tulpn` to check if another tenant or process owns that port:
   - If the port is **free** or already owned by `floxa`: it uses the port.
   - If the port is **used by another user** (e.g. `flumenx`, `root`, `www-data`): it logs a collision warning and probes the next port (`5002`, `5003`... / `3002`, `3003`...).
3. The selected collision-free port is dynamically written to:
   - `/etc/floxa/backend.env` (`PORT=<SAFE_PORT>`)
   - `/etc/floxa/frontend.env` (`PORT=<SAFE_PORT>`)
   - `/etc/systemd/system/floxa-backend.service`
   - `/etc/systemd/system/floxa-frontend.service`
4. The script prints the exact selected ports in its final summary.

### Manual Port Verification Command
Run this anytime on the VPS to see which ports are currently listening on localhost:
```bash
ss -tulpn | grep 127.0.0.1
```
You can see all listening processes, their PIDs, and their respective user owners.

---

## 3. ZERO-EFFECT GUARANTEE FOR EXISTING WEBSITES

| Neighboring Site / Service | Protection Mechanism | Effect |
| :--- | :--- | :--- |
| **`floxa.flumenx.in` (Floxa Design)** | Separate domain vhost in CloudPanel, separate document root (`/home/floxa/htdocs/floxa.flumenx.in/`), separate processes. | **Zero effect** |
| **`flumenx-api-*` Backends** | Dynamic port probing ensures ports 5001/3001 or any existing Node.js ports are never claimed or interrupted. | **Zero effect** |
| **MySQL / MariaDB Databases** | FLOXA uses MongoDB 7.0 Community Edition on `127.0.0.1:27017` only. Never connects to or touches MySQL. | **Zero effect** |
| **Existing SSH Users & Keys** | `/home/floxa/.ssh` is isolated to user `floxa`. Default SSH port `22` and `/etc/ssh/sshd_config` remain untouched. | **Zero effect** |
| **CloudPanel Nginx Global Config** | CloudPanel uses isolated include files (`/etc/nginx/sites-enabled/work.flumenx.in.conf`). No global Nginx files overwritten. | **Zero effect** |

