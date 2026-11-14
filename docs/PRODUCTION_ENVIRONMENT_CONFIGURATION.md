# FLOXA Work — Production Environment Configuration Guide

**Environment Scope:** Staging & Production Deployment  
**Standard:** 12-Factor App Configuration & Secret Zero-Leakage  
**Date:** 14 November 2026  

---

## 1. Architectural Philosophy

FLOXA Work configuration strictly decouples source code from runtime credentials and environment-specific settings. 

### Key Principles:
1. **Zero Hardcoded Secrets:** All API keys, database strings, and JWT cryptographic seeds are injected at runtime via environment variables or cloud secret managers (e.g., AWS Secrets Manager, HashiCorp Vault, Doppler).
2. **Fail-Fast Validation:** If any mandatory configuration variable is missing or insecure upon application boot in `production` mode, the process terminates immediately with an explicit fatal error.
3. **No Fallback Secrets in Production:** Development fallback keys (e.g. `'floxa_work_default_access_secret_key'`) are explicitly forbidden when `NODE_ENV === 'production'`.
4. **Secret Redaction:** Logs, health endpoints, and error stack traces redact database passwords and cryptographic tokens.
5. **No Client Secret Exposure:** Only variables prefixed with `NEXT_PUBLIC_` are bundled into the client browser build.

---

## 2. Environment Variables Specification

### Core Application Variables
| Variable | Required in Prod | Default (Dev) | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | `development` | Environment mode (`development`, `test`, `staging`, `production`) |
| `PORT` | No | `5001` | TCP port for the Node.js HTTP/WebSocket server |
| `TRUST_PROXY` | Yes (if behind proxy) | `0` | Set to `1` when running behind NGINX, ALB, or Cloudflare |

### Database Variables
| Variable | Required in Prod | Default (Dev) | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Yes | `mongodb://127.0.0.1:27017/floxa_work_db` | MongoDB connection URI with replica set and TLS |
| `DB_MAX_POOL_SIZE`| No | `50` | Maximum simultaneous MongoDB connection pool sockets |
| `DB_MIN_POOL_SIZE`| No | `5` | Minimum idle sockets maintained in pool |
| `DB_SERVER_SELECTION_TIMEOUT_MS` | No | `5000` | Driver timeout for finding an available replica member |

### Cryptographic Security Variables
| Variable | Required in Prod | Minimum Entropy | Description |
| :--- | :---: | :--- | :--- |
| `JWT_ACCESS_SECRET` | **YES (FATAL)** | 32+ characters | HMAC secret used to sign 15-minute access tokens |
| `JWT_REFRESH_SECRET`| **YES (FATAL)** | 32+ characters | HMAC secret used to sign 7-day refresh tokens |
| `CORS_ORIGIN` | **YES (FATAL)** | URL list | Comma-separated allowlist of valid frontend origins |

### Storage Abstraction Variables
| Variable | Required in Prod | Default (Dev) | Description |
| :--- | :---: | :--- | :--- |
| `STORAGE_PROVIDER` | No | `local` | `local` for disk storage, `s3` for AWS S3 / Cloudflare R2 |
| `STORAGE_LOCAL_PATH` | If local | `media/private_vault/`| Isolated directory for private deliverables |
| `S3_ENDPOINT` | If s3 | N/A | S3-compatible API endpoint URL |
| `S3_BUCKET` | If s3 | N/A | Dedicated private object bucket name |
| `S3_REGION` | If s3 | `auto` | AWS region or Cloudflare `auto` |
| `S3_ACCESS_KEY_ID` | If s3 | N/A | Object storage access key ID |
| `S3_SECRET_ACCESS_KEY` | If s3 | N/A | Object storage secret access key |

---

## 3. Staging vs Production Configuration Topology

```
┌────────────────────────────────────────────────────────┐
│                   STAGING TOPOLOGY                     │
│  - Single MongoDB 8.x replica set instance             │
│  - Local disk private storage with isolated paths      │
│  - Mock / Sandbox Email logging                        │
│  - Non-production test domains in CORS allowlist       │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                  PRODUCTION TOPOLOGY                   │
│  - MongoDB Atlas Multi-AZ 3-Node Replica Set           │
│  - Cloudflare R2 / AWS S3 private object bucket        │
│  - Verified transactional SMTP (Mailgun/SendGrid)      │
│  - HTTPS strictly enforced; TLS 1.3 termination        │
│  - Hardened CORS: https://floxa.work                   │
└────────────────────────────────────────────────────────┘
```

