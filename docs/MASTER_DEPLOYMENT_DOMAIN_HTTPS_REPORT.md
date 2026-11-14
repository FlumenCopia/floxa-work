# FLOXA WORK — MASTER DEPLOYMENT DOMAIN & HTTPS REPORT

**Primary Target Domains (`flumenx.in` Subdomains):**  
- **Frontend App:** `work.flumenx.in` (or `floxawork.flumenx.in`)  
- **Backend API & WebSockets:** `api-work.flumenx.in` (or `work-api.flumenx.in`)  
- **Alternative Domain:** `app.floxa.work` & `api.floxa.work`  

*(Note: `floxa.flumenx.in` is reserved for Floxa Design, so Floxa Work uses `work.flumenx.in`).*

**Host Server IP:** `89.116.121.25` (Hostinger Ubuntu VPS)  
**Web Server:** CloudPanel-Managed Nginx Reverse Proxy  
**SSL Provider:** Let's Encrypt (Automated issuance via CloudPanel)  

---

## 1. DNS A-Record Mapping for `flumenx.in`

In the DNS Management Zone for `flumenx.in` (Hostinger DNS / Cloudflare):

| Hostname / Record | Type | Points to (IPv4) | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `work.flumenx.in` | **A** | `89.116.121.25` | Auto / 300s | Next.js Production Frontend |
| `api-work.flumenx.in` | **A** | `89.116.121.25` | Auto / 300s | Express REST API & WebSocket Server |

*Optional Alternative:* If you prefer explicit product branding, you can use `floxawork.flumenx.in` and `api-floxawork.flumenx.in`. Both are pre-configured in the Nginx Vhosts and CORS allowlists.

---

## 2. CloudPanel SSL Issuance & Nginx Reverse Proxy

In the CloudPanel Web Console (`https://89.116.121.25:8443`):

### 1. Frontend Site: `work.flumenx.in`
- **Site Type:** Node.js
- **Site User:** `floxa`
- **Port:** `3001`
- **Vhost Configuration:** Open **Vhost** tab, paste contents of [`scripts/cloudpanel/nginx_vhost_app.conf`](file:///d:/flumenx/floxa%20univerce/floxa%20work/scripts/cloudpanel/nginx_vhost_app.conf), click **Save**.
- **SSL Certificate:** Go to **SSL/TLS** tab > Select **Let's Encrypt** > Click **Create and Install**.

### 2. Backend & WebSockets Site: `api-work.flumenx.in`
- **Site Type:** Node.js
- **Site User:** `floxa`
- **Port:** `5001`
- **Vhost Configuration:** Open **Vhost** tab, paste contents of [`scripts/cloudpanel/nginx_vhost_api.conf`](file:///d:/flumenx/floxa%20univerce/floxa%20work/scripts/cloudpanel/nginx_vhost_api.conf) (enables WebSocket `/ws` reverse proxy upgrade), click **Save**.
- **SSL Certificate:** Go to **SSL/TLS** tab > Select **Let's Encrypt** > Click **Create and Install**.

---

## 3. Post-Deployment Verification Commands

Run these verification checks from your local terminal or VPS:

```bash
# 1. Verify DNS resolution
dig +short work.flumenx.in
dig +short api-work.flumenx.in
# Both must return 89.116.121.25

# 2. Verify Frontend HTTPS
curl -I https://work.flumenx.in
# Expected: HTTP/2 200 OK

# 3. Verify Backend REST Health
curl -I https://api-work.flumenx.in/health/live
# Expected: HTTP/2 200 OK

# 4. Verify WebSocket Upgrade
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Host: api-work.flumenx.in" \
  -H "Origin: https://work.flumenx.in" \
  https://api-work.flumenx.in/ws
# Expected: HTTP/1.1 101 Switching Protocols
```
