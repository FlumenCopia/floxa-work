# FLOXA Work — Database Backup Policy & Retention Strategy

**Standard:** SOC 2 Type II / ISO 27001 Data Protection  
**Target Database:** MongoDB 8.x / MongoDB Atlas  
**Architecture:** Automated Snapshots + Point-In-Time Recovery (PITR) + Standalone Dump Verification  
**Date:** 14 November 2026  

---

## 1. Objectives & Metrics

- **Recovery Point Objective (RPO):** Maximum allowable data loss window:
  - **Critical Tier (Contracts, Payments, Milestones, Users):** $\le 15 \text{ minutes}$ (Continuous Oplog Archiving).
  - **Standard Tier (Posts, Social Feed, Drafts):** $\le 1 \text{ hour}$.
- **Recovery Time Objective (RTO):** Maximum acceptable duration to restore service:
  - Full cluster restoration: $\le 60 \text{ minutes}$.
  - Target collection point-in-time rollback: $\le 20 \text{ minutes}$.

---

## 2. Backup Topology & Cadence

```
┌─────────────────────────────────────────────────────────────┐
│                 PRODUCTION MONGODB CLUSTER                  │
│       3-Node Multi-AZ Replica Set with Dedicated Volumes    │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│     CONTINUOUS OPLOG (PITR)   │   │     HOURLY SNAPSHOT ARCHIVES  │
│  - Continuous stream to S3/R2 │   │  - Compressed JSON/BSON Dump  │
│  - 7-day granular rollback    │   │  - SHA-256 Checksum Verified  │
│  - Client-side AES-256 GCM    │   │  - Cross-region replicated    │
└───────────────────────────────┘   └───────────────────────────────┘
```

### Backup Frequency & Retention Matrix
| Backup Type | Execution Cadence | Storage Location | Retention Window | Encryption Standard |
| :--- | :--- | :--- | :--- | :--- |
| **Continuous Oplog** | Continuous ($\le 1 \text{ min}$) | Multi-AZ Cloud Object Vault | 7 Days | AES-256-GCM / AWS KMS |
| **Daily Snapshots** | Daily at 02:00 UTC | Cross-Region Cold Storage | 30 Days | AES-256-GCM |
| **Weekly Archives** | Sundays at 03:00 UTC | Immutable WORM Cloud Vault | 90 Days | AES-256-GCM |
| **Monthly Compliance**| 1st of month | Off-site Cold Glacier Archive | 365 Days | AES-256-GCM |

---

## 3. Security, Encryption & Integrity Validation

1. **Encryption at Rest:** All backup archives are encrypted before transfer using AES-256-GCM with customer-managed keys (CMK).
2. **Encryption in Transit:** Transfers strictly require TLS 1.3 with mutual certificate verification.
3. **Immutability (Object Lock / WORM):** Weekly and monthly compliance archives enable cloud object locking to prevent ransomware deletion.
4. **Automated Verification:** Every backup archive executes a SHA-256 integrity checksum verification and test extraction into an isolated validation database (`floxa_work_db_restore_test`).
5. **Zero Secret Leakage:** Backup scripts consume database URIs via secured environment variables. Passwords and keys are never printed in console output or stored in unencrypted log files.

