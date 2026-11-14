# FLOXA Work — Comprehensive Security Audit & Hardening Report

**Date:** 2026-11-14  
**Classification:** Internal Engineering Security Review  

---

## 1. Security Baseline & Threat Matrix

| Risk Domain | Current Vulnerability / Finding | Severity | Hardening Measure | Status |
|---|---|---|---|---|
| **Authentication** | Passwords hashed with bcryptjs salt 10; static JWT without revocation or refresh rotation | **High** | Increase salt rounds to 12; implement JWT expiry check with refresh token rotation. | Planned |
| **Brute Force & Flooding** | No rate limiting on `/api/auth/login` or `/api/auth/register` | **Critical** | Install `express-rate-limit` with 10 attempts per 15 min for auth, 100/min for general API. | Planned |
| **API Security Headers** | No Helmet middleware; default Express headers (`X-Powered-By: Express`) exposed | **High** | Integrate `helmet` with CSP, HSTS, X-Content-Type-Options, Frameguard. | Planned |
| **Input Validation** | Some endpoints lack strict Zod/Joi validation, permitting uncontrolled JSON attributes | **Medium** | Enforce Zod schemas on all brief, proposal, milestone, and profile mutation endpoints. | Planned |
| **File Upload Vulnerabilities** | File uploads currently do not validate MIME types, extensions, or file content signatures | **Critical** | Implement Multer with strict whitelist (JPEG, PNG, WebP, PDF, ZIP), size limits, and safe renaming. | Planned |
| **Private File Authorization** | Deliverable files could be accessed without owner or client verification | **Critical** | Enforce resource-level authorization checks before issuing signed download URLs. | Planned |
| **WebSocket Authentication** | WebSocket connections do not verify JWT token on handshake or message emission | **High** | Require JWT token in connection query param `?token=` and verify before accepting connection. | Planned |
| **Direct Payment Tampering** | Payment reference IDs are generated client-side or without webhook HMAC validation | **High** | Enforce server-side payment verification and idempotency tracking with HMAC signature checks. | Planned |
| **CORS Policy** | CORS config in `app.ts` defaults to permissive callback in development | **Medium** | Restrict CORS allowlist strictly to verified domains in production (`http://localhost:3000,http://localhost:3001`). | Planned |
| **Data Exposure** | Password hashes are omitted via `toJSON`, but raw Mongoose queries could leak sensitive fields | **Medium** | Enforce `.select('-passwordHash')` on all user population queries across all controllers. | Planned |

---

## 2. Hardening Action Plan

1. **Authentication:** Add password complexity rules (min 8 chars, mixed case, number, symbol), rate limiting on login/register endpoints, and password reset token generation.
2. **File Security Pipeline:**
   - Whitelist file extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`, `.zip`.
   - Disallow executable extensions (`.exe`, `.sh`, `.bat`, `.js`, `.php`).
   - Hash and sanitize storage keys (`uploads/<uuid>-<timestamp>.<ext>`).
   - Store files outside public webroot; serve exclusively through authenticated controller stream.
3. **HTTP & Express Layer:**
   - Mount `helmet()` middleware.
   - Configure strict CORS origin check.
   - Disable `x-powered-by`.
4. **WebSocket Guarding:**
   - On connection: verify `jwt.verify(token, ENV.JWT_ACCESS_SECRET)`.
   - Disconnect sockets with invalid or expired credentials.
   - Limit room join operations to authenticated user's active contracts and chats.

