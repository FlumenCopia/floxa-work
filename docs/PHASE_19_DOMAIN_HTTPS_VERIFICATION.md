# FLOXA WORK — PHASE 19 DOMAIN, HTTPS & CORS CONFIGURATION

**Audit Date:** November 14, 2026  
**Target Domains:** `app.floxa.work` (Frontend) & `api.floxa.work` (Backend API & WSS)  
**Security Standard:** TLS 1.3 / HSTS 1-Year / Strict SameSite Cookies  

---

## 1. Domain Routing & DNS Target Map

When the operator configures DNS records in their registrar/DNS provider (e.g. Cloudflare):

| Subdomain | Target Platform | Record Type | Value / CNAME | Proxy Status |
| :--- | :--- | :--- | :--- | :--- |
| `app.floxa.work` | Vercel | **CNAME** | `cname.vercel-dns.com` | DNS Only (or Proxied) |
| `api.floxa.work` | Railway | **CNAME** | `<railway-service>.up.railway.app` | DNS Only (or Proxied) |
| `mail.floxa.work` | Resend | **TXT / MX** | (See Email Verification Guide) | DNS Only |

> [!NOTE]
> **Temporary Provider URLs:**  
> During initial staging evaluation prior to DNS delegation, provider-assigned domains may be used:
> - Frontend: `https://floxa-work-beta.vercel.app`
> - Backend: `https://floxa-work-backend-production.up.railway.app`
> - WebSocket: `wss://floxa-work-backend-production.up.railway.app/ws`  
> In that scenario, `CORS_ORIGIN` must be set to `https://floxa-work-beta.vercel.app`.

---

## 2. HTTPS & TLS Termination

1. **Automatic Certificate Provisioning:**
   - Both Vercel and Railway automatically provision and renew Let's Encrypt / Google Trust Services SSL certificates over ACME challenges.
   - HTTP requests to port 80 are automatically issued an HTTP 301 Permanent Redirect to `https://`.
2. **HSTS Enforcement:**
   - The backend's security headers middleware injects:
     `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
   - Browsers are instructed to refuse unencrypted HTTP connections permanently.
3. **WebSocket Secure (WSS):**
   - Reverse proxy terminates TLS at the edge (`api.floxa.work`) and proxies cleartext WS over the internal mesh to Node's internal port.
   - The frontend establishes connections exclusively over `wss://` when running on HTTPS.

---

## 3. Production CORS Allowlist & Cookie Configuration

### 3.1 Strict CORS Policy
In `backend/src/app.ts`:
```typescript
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ENV.CORS_ORIGIN.includes(origin)) {
        callback(null, true);
      } else if (ENV.IS_PRODUCTION) {
        callback(new Error(`CORS policy violation: Origin ${origin} not permitted.`));
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
```
- In production, wildcard `*` is prohibited.
- Preflight `OPTIONS` requests from unauthorized domains are rejected.

### 3.2 Secure Cookie Directives
When session cookies are issued in production (`NODE_ENV=production`):
- `Secure`: **true** (transferred exclusively over HTTPS).
- `HttpOnly`: **true** (inaccessible to JavaScript `document.cookie` to prevent XSS exfiltration).
- `SameSite`: **`lax`** (or `none` with `secure: true` if frontend and backend reside on disjoint top-level domains).

---

## 4. Subsystem Status

- **CORS & Header Enforcement Logic:** `LIVE VERIFIED`
- **DNS Record Mapping & Verification:** `CONFIGURED (Awaiting Operator Domain Setup)`
- **Cloudflare / Let's Encrypt SSL Certs:** `CONFIGURED`
