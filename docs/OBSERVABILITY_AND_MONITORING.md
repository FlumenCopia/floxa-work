# FLOXA Work — Observability, Structured Logging & Error Monitoring

**Standards:** High-Resolution Telemetry & Redaction Guarantees  
**Endpoints:** `/health/live` & `/health/ready` & `/api/admin/system-health`  
**Date:** 14 November 2026  

---

## 1. Observability Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 INCOMING HTTP / WS REQUEST                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Injects X-Request-Id header
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             REQUEST CORRELATION MIDDLEWARE                 │
│   - Binds crypto.randomUUID() to req.requestId              │
│   - Propagates X-Request-Id into all downstream logs        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             CENTRALIZED LOGGING & ERROR HANDLER             │
│   - Redacts passwordHash, tokens, secrets, auth headers    │
│   - Structured JSON output format                           │
│   - Health Probes: /health/live (Process)                   │
│                    /health/ready (MongoDB + Storage Vault)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Health & Readiness Probes

### A. Liveness Probe (`GET /health/live` or `/health`)
Indicates whether the Node.js application process is running and responding to HTTP requests.
```json
{
  "status": "ok",
  "service": "floxa-work-backend",
  "uptimeSeconds": 1420,
  "timestamp": "2026-11-14T15:00:00.000Z"
}
```

### B. Readiness Probe (`GET /health/ready`)
Indicates whether the instance is ready to receive marketplace traffic. Verifies MongoDB cluster connectivity (`ping`) and storage vault availability. Returns `HTTP 503` if MongoDB is disconnected.
```json
{
  "status": "ready",
  "database": {
    "status": "connected",
    "pingMs": 3,
    "name": "floxa_work_db"
  },
  "storage": {
    "provider": "local",
    "status": "online"
  },
  "uptimeSeconds": 1420,
  "timestamp": "2026-11-14T15:00:00.000Z"
}
```

---

## 3. Sensitive Data Redaction Policy

The logging framework strictly redacts:
1. Passwords, hashes, and authentication salts.
2. JWT Access and Refresh tokens.
3. Reset tokens and email verification tokens.
4. Database connection strings containing user/password credentials.
5. Authorization bearer tokens in headers.

