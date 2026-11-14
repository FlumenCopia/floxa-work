# FLOXA WORK — PHASE 21 DNS & LET'S ENCRYPT HTTPS VERIFICATION

**Target Subdomains:** `app.floxa.work` (Frontend) & `api.floxa.work` (Backend / WSS)  
**Certificate Authority:** Let's Encrypt (ACME v2) via Certbot  
**Security Standard:** TLS 1.3 / Strict-Transport-Security (HSTS) / Automatic Renewal  

---

## 1. DNS Pre-Requisite & Delegation

Before requesting SSL certificates, the operator must configure A-records at the domain registrar / DNS manager (e.g., Cloudflare, Namecheap, Hostinger DNS) pointing to the Hostinger VPS public IP:

| Hostname | Type | Value / Destination | TTL |
| :--- | :--- | :--- | :--- |
| `app.floxa.work` | **A** | `<HOSTINGER_VPS_PUBLIC_IP>` | Auto / 300s |
| `api.floxa.work` | **A** | `<HOSTINGER_VPS_PUBLIC_IP>` | Auto / 300s |

### Verification Command (Run from your local terminal or VPS):
```bash
dig +short app.floxa.work
dig +short api.floxa.work
# Both must return the Hostinger VPS Public IP
```

---

## 2. Automated SSL Issuance via Certbot

Once DNS has propagated, run Certbot to automatically fetch certificates and configure Nginx:

```bash
sudo certbot --nginx -d app.floxa.work -d api.floxa.work --non-interactive --agree-tos -m admin@floxa.work --redirect
```

### What Certbot Configures Automatically:
1. Obtains 90-day RSA-2048 / ECDSA certificates from Let's Encrypt.
2. Writes SSL directives (`ssl_certificate`, `ssl_certificate_key`) into `/etc/nginx/sites-available/floxa-work`.
3. Adds HTTP-to-HTTPS 301 Permanent Redirect on port 80.
4. Registers an automated systemd timer (`certbot.timer`) that runs twice daily to renew certificates 30 days before expiration.

---

## 3. Post-SSL Verification Tests

```bash
# 1. Verify HTTPS response from external host
curl -I https://app.floxa.work
# Expected: HTTP/2 200 OK

curl -I https://api.floxa.work/health/live
# Expected: HTTP/2 200 OK

# 2. Test Certbot renewal dry-run
sudo certbot renew --dry-run
# Expected: All simulated renewals succeeded
```
