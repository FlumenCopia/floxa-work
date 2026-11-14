# FLOXA Work — Incident Response Runbook

**Standard:** SRE Severity Protocol & Incident Management  
**Scope:** Production Outages, Security Incidents, Data Integrity Breaches  
**Date:** 14 November 2026  

---

## 1. Incident Severity Definitions

- **SEV-1 (Critical Outage):** Core marketplace unavailable (e.g. login down, contracts inaccessible, database unreachable). RTO $\le 30\text{ min}$.
- **SEV-2 (Major Degradation):** Significant feature failure affecting multiple users (e.g. deliverable uploads failing, WebSocket chat disconnects, analytics aggregation failure). RTO $\le 2\text{ hours}$.
- **SEV-3 (Minor Incident):** Non-blocking issue with immediate workaround (e.g. email notification delay, minor UI rendering bug). RTO $\le 24\text{ hours}$.

---

## 2. Standard Incident Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DETECTION & ALERTING                                     │
│    - Automated health probe failure (/health/ready)         │
│    - PagerDuty / Sentry alert triggered                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. TRIAGE & CONTAINMENT                                     │
│    - Designate Incident Commander (IC)                      │
│    - If security breach: Revoke affected session families   │
│    - If storage degradation: Fall back to local vault       │
│    - If memory leak: Trigger graceful PM2 rolling restart   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. REMEDIATION & ROOT CAUSE INVESTIGATION                   │
│    - Trace logs using X-Request-Id correlation              │
│    - Check MongoDB slow queries & connection pool status    │
│    - Apply hotfix or trigger immediate rollback             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. POST-MORTEM & ACTION ITEMS                               │
│    - Publish blameless post-mortem within 48 hours          │
│    - Add regression automated test case                     │
└─────────────────────────────────────────────────────────────┘
```
