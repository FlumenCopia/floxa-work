# FLOXA WORK — MASTER DEPLOYMENT DOMAIN & HTTPS REPORT

**Target Domains:** `app.floxa.work` (Frontend) & `api.floxa.work` (Backend & WebSockets)  
**Host Server IP:** `89.116.121.25`  
**Web Server:** CloudPanel-Managed Nginx Reverse Proxy  
**SSL Provider:** Let's Encrypt (Automated issuance via CloudPanel)  

---

## 1. DNS A-Record Mapping

The operator must configure A-records at their DNS provider (Cloudflare, Namecheap, Hostinger DNS) pointing to the VPS IP `89.116.121.25`:

| Hostname | Type | Value | TTL |
| :--- | :--- | :--- | :--- |
| `app.floxa.work` | **A** | `89.116.121.25` | Auto / 300s |
| `api.floxa.work` | **A** | `89.116.121.25` | Auto / 300s |

---

## 2. CloudPanel SSL Issuance & Nginx Reverse Proxy

In CloudPanel (`https://89.116.121.25:8443`):
1. **Frontend (`app.floxa.work`):**
   - Vhost routes traffic to `http://127.0.0.1:3001`.
   - SSL/TLS tab issues automatic Let's Encrypt certificate.
2. **Backend & WebSockets (`api.floxa.work`):**
   - Vhost routes REST traffic to `http://127.0.0.1:5001`.
   - Vhost routes `/ws` with `Upgrade` and `Connection "upgrade"` headers for persistent WebSockets.
   - SSL/TLS tab issues automatic Let's Encrypt certificate.
3. **HTTP to HTTPS Redirection:** CloudPanel automatically enforces 301 Permanent Redirect to HTTPS.

---

## 3. Post-Deployment Verification

```bash
# Verify DNS resolution
dig +short app.floxa.work
dig +short api.floxa.work
# Must return 89.116.121.25

# Verify HTTPS certificate
curl -I https://app.floxa.work
# Expected: HTTP/2 200 OK

curl -I https://api.floxa.work/health/live
# Expected: HTTP/2 200 OK
```
