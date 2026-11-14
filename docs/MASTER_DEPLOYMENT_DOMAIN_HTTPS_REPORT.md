# FLOXA WORK — MASTER DEPLOYMENT DOMAIN & HTTPS REPORT

**Primary Domains (`flumenx.in` Subdomains):**  
- **Frontend App:** `floxa.flumenx.in` (or `work.flumenx.in`)  
- **Backend API & WebSockets:** `api-floxa.flumenx.in` (or `floxa-api.flumenx.in`)  
- **Alternative/Custom Domain:** `app.floxa.work` & `api.floxa.work`  

**Host Server IP:** `89.116.121.25` (Hostinger Ubuntu VPS)  
**Web Server:** CloudPanel-Managed Nginx Reverse Proxy  
**SSL Provider:** Let's Encrypt (Automated issuance via CloudPanel)  

---

## 1. DNS A-Record Mapping for `flumenx.in`

In the DNS Management Zone for `flumenx.in` (Hostinger DNS / Cloudflare):

| Hostname / Record | Type | Points to (IPv4) | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `floxa.flumenx.in` (or `work`) | **A** | `89.116.121.25` | Auto / 300s | Next.js Production Frontend |
| `api-floxa.flumenx.in` (or `floxa-api`) | **A** | `89.116.121.25` | Auto / 300s | Express REST API & WebSocket Server |

*Note: If a wildcard record `*.flumenx.in` already exists on the VPS, these subdomains resolve automatically without any additional DNS changes.*

---

## 2. CloudPanel SSL Issuance & Nginx Reverse Proxy

In the CloudPanel Web Console (`https://89.116.121.25:8443`):

### 1. Frontend Site: `floxa.flumenx.in`
- **Site Type:** Node.js
- **Site User:** `floxa`
- **Port:** `3001`
- **Vhost Configuration:** Open **Vhost** tab, paste contents of [`scripts/cloudpanel/nginx_vhost_app.conf`](file:///d:/flumenx/floxa%20univerce/floxa%20work/scripts/cloudpanel/nginx_vhost_app.conf), click **Save**.
- **SSL Certificate:** Go to **SSL/TLS** tab > Select **Let's Encrypt** > Click **Create and Install**.

### 2. Backend & WebSockets Site: `api-floxa.flumenx.in`
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
dig +short floxa.flumenx.in
dig +short api-floxa.flumenx.in
# Both must return 89.116.121.25

# 2. Verify Frontend HTTPS
curl -I https://floxa.flumenx.in
# Expected: HTTP/2 200 OK

# 3. Verify Backend REST Health
curl -I https://api-floxa.flumenx.in/health/live
# Expected: HTTP/2 200 OK

# 4. Verify WebSocket Upgrade
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Host: api-floxa.flumenx.in" \
  -H "Origin: https://floxa.flumenx.in" \
  https://api-floxa.flumenx.in/ws
# Expected: HTTP/1.1 101 Switching Protocols
```
