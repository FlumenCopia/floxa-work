# FLOXA WORK — PHASE 18 PRODUCTION ENVIRONMENT CONFIGURATION

**Target Platforms:** Vercel (Frontend), Railway (Backend & WebSockets), MongoDB Atlas (Database), Cloudflare R2 (Vault), Resend (Email)  
**Security Standard:** Zero Hardcoded Secrets, Fail-Fast Server Boot Validation, Strict CORS Origin Checking  

---

## 1. Production Secrets & Token Generation

Production requires two independent, cryptographically secure 256-bit secret keys for signing JSON Web Tokens:

```bash
# 1. JWT Access Secret (Used for 15-minute access tokens)
openssl rand -hex 32

# 2. JWT Refresh Secret (Used for 7-day refresh token families)
openssl rand -hex 32
```

In `backend/src/config/env.ts`, the backend verifies at startup that:
1. `NODE_ENV === 'production'`.
2. Both keys are populated and at least 32 characters long.
3. Neither key matches any known development fallback or trivial password.
4. If invalid, the process aborts immediately before binding ports.

---

## 2. Cross-Origin Resource Sharing (CORS) Policy

In production, CORS is restricted to explicit authorized domains:

```typescript
// backend/src/app.ts
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
```

- **Allowed Production Origins:**
  - `https://app.floxa.work`
  - `https://floxa-work.vercel.app`
- Any untrusted third-party browser origin attempting to make credentialed requests to `api.floxa.work` is blocked by CORS.

---

## 3. WebSocket Upgrade & Protocol Security

- **Path:** `/ws`
- **Protocol:** Secured via `WSS` (`wss://api.floxa.work/ws`) when deployed behind Cloudflare / Railway TLS termination.
- **Connection Security:**
  - Clients must transmit their authenticated JWT access token upon connection or first message.
  - Room join requests (`contract:${contractId}`) verify participant permissions against MongoDB. Non-participants are rejected with error code 4403.
  - Heartbeat ping/pong intervals prevent proxy socket timeout drops.

---

## 4. Private Vault & Storage Configuration

- **Abstraction:** `backend/src/services/storage/` provides `IStorageProvider`.
- **Active Adapter:** `S3CompatibleStorageProvider` reads `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
- **Cloudflare R2 Specifics:**
  - Egress bandwidth: $0.00 / GB.
  - Bucket visibility: **Private** (zero public anonymous reads).
  - Downloads route through authenticated backend stream: `GET /api/files/:fileName/download`.

---

## 5. Reverse Proxy & Trust Configuration

- `TRUST_PROXY=true`: Configures Express `app.set('trust proxy', 1)`, ensuring client IP addresses and protocol headers (`X-Forwarded-For`, `X-Forwarded-Proto`) are correctly preserved through Cloudflare, Vercel, and Railway proxies for accurate rate-limiting and audit logging.
