# FLOXA WORK — PHASE 17 EMAIL & ACCOUNT ONBOARDING SPECIFICATION

**Objective:** Transparent, Trustworthy, and Secure User Account Lifecycle  
**Constraint:** In local development and mock mode, keep email delivery functional without pretending third-party delivery occurred.  

---

## 1. Account Lifecycle States & Workflows

```
[ User Registers ] ──► [ Password Hash (bcrypt) ] ──► [ JWT Session Token ]
         │                                                      │
         ▼                                                      ▼
[ Verification Email Triggered ]                       [ Active Collaboration ]
(Resend / SMTP or Log Driver)                                   │
         │                                                      ▼
         ▼                                             [ Refresh Token Family ]
[ Cryptographic Token Verified ]                      (7-Day Auto-Rotation)
```

---

## 2. Authentication Workflows Detail

### 2.1 User Registration (`POST /api/auth/register`)
- Accepts `name`, `handle`, `email`, `password`, and `role` (`client` | `freelancer`).
- Enforces strict password complexity (minimum 8 characters, upper, lower, digit, special character).
- Generates a 15-minute access token and stores a cryptographically hashed 7-day refresh token family in MongoDB.
- Queues an email verification token.

### 2.2 Email Verification & Fallback Driver
- **Production Mode (`EMAIL_PROVIDER=resend` | `smtp`):**
  - Sends a secure HTML email with a single-use verification link: `https://app.floxa.work/verify-email?token=<crypto_hash>`.
- **Development / Local Fallback (`EMAIL_PROVIDER=log`):**
  - Logs the verification URL directly to the terminal stdout with an explicit developer label:
    `[EMAIL LOG DRIVER] To: user@example.com | Subject: Verify Email | Link: http://localhost:3001/verify-email?token=...`
  - Zero false claims: The system does not mislead the client by claiming the message was sent to an external mailbox.

### 2.3 Password Reset Flow (`POST /api/auth/forgot-password` & `POST /api/auth/reset-password`)
- Single-use, time-limited (1-hour) cryptographic reset token.
- Resets password, invalidates previous hash, and revokes all active session refresh tokens across all devices.

### 2.4 Session Expiration & Refresh Token Rotation
- Access tokens expire after 15 minutes to minimize exposure in case of token interception.
- When an access token expires, client requests `/api/auth/refresh`.
- The server validates the refresh token, rotates it (issues a new refresh token), and invalidates the previous one.
- **Replay Attack Defense:** If a revoked refresh token is presented again (indicating token compromise), the entire token family is immediately purged, locking out the intruder.

### 2.5 Clean Logout (`POST /api/auth/logout`)
- Invalidates the active refresh token in the database.
- Clears client session memory and browser storage.
