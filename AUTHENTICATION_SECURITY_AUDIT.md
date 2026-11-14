# FLOXA WORK — AUTHENTICATION SECURITY AUDIT

**Date:** 14 November 2026  
**Auditor:** Principal Software Architect & Application Security Lead  
**Scope:** FLOXA Work Authentication, Token Lifecycle, Session Management, Account Recovery & Verification  
**Status:** **PASSED & HARDENED FOR PRODUCTION**

---

## 1. Executive Summary

FLOXA Work has transitioned to an enterprise-grade multi-tier authentication architecture. Prior implementations relying on static 7-day JWT access tokens without rotation or server-side invalidation have been replaced with:

1. **Short-Lived Access Tokens (15 Minutes):** Limits window of vulnerability if an access token is intercepted.
2. **High-Entropy Refresh Tokens (40-Byte Hex):** Stored server-side exclusively as SHA-256 hashes within `Session.model.ts`.
3. **Automatic Refresh Token Rotation & Token Family Tracking:** Every token refresh revokes the current session and issues a fresh pair linked to the family ID.
4. **Active Token Reuse Detection (Replay Protection):** If an expired or already rotated refresh token is presented, the system flags a potential token compromise and immediately terminates all active sessions associated with the user.
5. **Cryptographic Password Recovery:** 32-byte crypto tokens stored as SHA-256 hashes with 1-hour expiration, single-use enforcement, account enumeration protection, and automatic mass session termination upon password update.
6. **Anti-Harvesting Account Enumeration Defense:** Password reset endpoints return identical success messages regardless of whether the requested email address exists in the database.
7. **Immutable Audit Logging:** All registration, login, token rotation, reuse breaches, password resets, and session revocations are recorded in `audit_logs` collection.

---

## 2. Threat Model & Mitigation Matrix

| Threat | Vulnerability in Baseline | Mitigation Implemented | Verification Result |
| :--- | :--- | :--- | :--- |
| **Token Theft / Replay Attack** | Static 7-day access token could be replayed indefinitely until expiry. | 15-minute access token + Refresh Token rotation with automatic reuse detection. Reusing an old token revokes all user sessions. | **Verified:** Test 2 in `security_and_payment_integrity.test.cjs` confirmed 403 Forbidden and immediate invalidation of token family. |
| **Account Enumeration / Harvesting** | Endpoints previously returned 404 if email was not found. | Uniform response: *"If that email is registered, password reset instructions have been sent."* | **Verified:** Tested with real and non-existent emails; identical responses returned. |
| **Brute Force & Credential Stuffing** | Unlimited login attempts allowed. | In-memory sliding-window `authRateLimiter` enforces strict request limits per IP window with `Retry-After` header. | **Verified:** Rate limiter blocks excessive requests with HTTP 429. |
| **Session Persistence Post-Password Reset** | Stolen sessions remained active after user changed password. | Password reset automatically revokes all sessions in MongoDB matching `userId`. | **Verified:** All existing sessions set to `isRevoked: true` on password change. |
| **Unauthorized File Download** | File download endpoint served any file if the ID existed without checking authorization. | Resource-level ownership and contract participant validation. Unauthorized users receive HTTP 403. | **Verified:** Tested intruder access against private deliverable; received HTTP 403 Forbidden. |

---

## 3. Endpoints & Security Specifications

### `POST /api/auth/register`
- Rate-limited: Yes (`authRateLimiter`)
- Input validation: email, password (hashed with bcrypt salt 12), name, handle, role
- Response: 15m Access Token, 40-byte Refresh Token, User object (without passwordHash)
- Audit Action: `AUTH_REGISTER`

### `POST /api/auth/login`
- Rate-limited: Yes (`authRateLimiter`)
- Verification: bcrypt comparison with timing safety
- Response: 15m Access Token, 40-byte Refresh Token, User object
- Audit Action: `AUTH_LOGIN`

### `POST /api/auth/refresh`
- Rate-limited: Yes (`authRateLimiter`)
- Reuse Detection: Compares SHA-256 hash against `Session.refreshTokenHash`. If `isRevoked === true`, mass-revokes all user sessions and logs `AUTH_TOKEN_REUSE_DETECTED`.
- Rotation: Revokes used token and issues new token pair.
- Audit Action: `AUTH_REFRESH_TOKEN`

### `POST /api/auth/logout`
- Revocation: Flags the matching session as `isRevoked: true`.
- Audit Action: `AUTH_LOGOUT`

### `POST /api/auth/forgot-password`
- Rate-limited: Yes (`authRateLimiter`)
- Protection: Zero account enumeration. Always returns generic success message.
- Token: `crypto.randomBytes(32)` hashed with SHA-256. 1-hour expiration.
- Audit Action: `PASSWORD_RESET_REQUEST`

### `POST /api/auth/reset-password`
- Rate-limited: Yes (`authRateLimiter`)
- Protection: Single-use token. Resets `passwordResetTokenHash` and `passwordResetExpires` to null immediately.
- Session Invalidation: Mass-revokes all active sessions for that user.
- Audit Action: `PASSWORD_RESET_SUCCESS`

### `GET /api/auth/sessions`
- Authorization: Bearer JWT (`requireAuth`)
- Returns: Active unrevoked sessions with `userAgent`, `ipAddress`, and `lastActiveAt`.

### `DELETE /api/auth/sessions/:sessionId`
- Authorization: Bearer JWT (`requireAuth`). Enforces `session.userId === req.user.id`.
- Action: Marks specific session as revoked.

### `POST /api/auth/sessions/revoke-all-others`
- Authorization: Bearer JWT (`requireAuth`).
- Action: Revokes all sessions belonging to user except the current active session.
