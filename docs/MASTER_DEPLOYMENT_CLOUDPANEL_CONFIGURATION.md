# FLOXA WORK — CLOUDPANEL INTEGRATION & SITE CONFIGURATION GUIDE

**Management Panel:** CloudPanel (`https://89.116.121.25:8443`)  
**Target User:** `floxa`  
**Site 1 (Frontend):** `work.flumenx.in` (or `floxawork.flumenx.in`) -> Reverse Proxy to `http://127.0.0.1:3001`  
**Site 2 (Backend & WebSockets):** `api-work.flumenx.in` (or `work-api.flumenx.in`) -> Reverse Proxy to `http://127.0.0.1:5001`  

---

## 1. CloudPanel Native Site Setup Protocol

To deploy FLOXA Work without modifying global server configurations, use CloudPanel's native UI:

### Step 1: Add Reverse Proxy Site for Backend (`api-work.flumenx.in`)
1. Log in to CloudPanel: `https://89.116.121.25:8443`.
2. Click **Add Site** > **Create a Reverse Proxy Site** (or **Node.js Site**).
3. **Domain Name:** `api-work.flumenx.in`.
4. **Site User:** Select existing user `floxa` (or let CloudPanel create it).
5. **Reverse Proxy URL:** `http://127.0.0.1:5001`.
6. Click **Create**.
7. Navigate to the site's **Vhost** tab, replace the configuration with [`scripts/cloudpanel/nginx_vhost_api.conf`](file:///d:/flumenx/floxa%20univerce/floxa%20work/scripts/cloudpanel/nginx_vhost_api.conf) (which adds WebSocket `/ws` upgrade support and 55 MB upload limits), and click **Save**.
8. Go to **SSL/TLS** tab > click **New Let's Encrypt Certificate** > click **Create and Install**.

---

### Step 2: Add Reverse Proxy Site for Frontend (`work.flumenx.in`)
1. In CloudPanel, click **Add Site** > **Create a Reverse Proxy Site**.
2. **Domain Name:** `work.flumenx.in`.
3. **Site User:** Select `floxa`.
4. **Reverse Proxy URL:** `http://127.0.0.1:3001`.
5. Click **Create**.
6. Go to the **Vhost** tab and paste [`scripts/cloudpanel/nginx_vhost_app.conf`](file:///d:/flumenx/floxa%20univerce/floxa%20work/scripts/cloudpanel/nginx_vhost_app.conf).
7. Go to **SSL/TLS** tab > click **New Let's Encrypt Certificate** > click **Create and Install**.

---

## 2. Directory Layout Under `/home/floxa/`

```text
/home/floxa/
├── htdocs/
│   ├── work.flumenx.in/          # Managed by CloudPanel
│   ├── api-work.flumenx.in/      # Managed by CloudPanel
│   └── floxa-work/               # Application Repository Clone
│       ├── backend/              # Express API running on 127.0.0.1:5001
│       └── frontend/             # Next.js running on 127.0.0.1:3001
├── private_vault/                # Isolated Deliverables (chmod 700)
├── backups/                      # Isolated Application Backups (chmod 700)
└── logs/                         # Nginx Access and Error Logs
```

---

## 3. Zero Impact on Neighboring Sites

CloudPanel automatically isolates site configurations in `/etc/nginx/sites-enabled/`. Changes to `floxa` virtual hosts only reload Nginx configuration (`nginx -s reload`), which is a zero-downtime, graceful worker reload that never drops active connections to other sites (`flumenx`, `floxa.flumenx.in` Floxa Design, `rwen-interiors`, `susrutha`, `foresight`).
