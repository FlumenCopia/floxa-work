# FLOXA Work — System Health Diagnostics & Performance Monitoring

**Module:** Infrastructure Operations & Platform Diagnostics  
**Route:** `GET /api/admin/health/diagnostics`  
**Security Tier:** `system:health` Permission Guarded  
**Date:** 14 November 2026  

---

## 1. System Health Architecture

The System Health Diagnostic subsystem provides real-time observability into the FLOXA Work production backend, database cluster, and disk storage vault without leaking internal connection strings, host credentials, or environment variables.

---

## 2. Real-Time Telemetry & Metrics

### A. MongoDB Cluster Ping Latency
```typescript
const startDbPing = Date.now();
await mongoose.connection.db?.admin().ping();
const dbLatencyMs = Date.now() - startDbPing;
```
The endpoint executes a native MongoDB administrative `ping` command to measure round-trip network and execution latency in milliseconds.

### B. Process Memory Usage & V8 Engine Statistics
Captured directly via `process.memoryUsage()`:
- **`rssMb` (Resident Set Size):** Total memory allocated for the Node.js process execution.
- **`heapUsedMb`:** Actual V8 heap memory consumed by active JavaScript objects.
- **`heapTotalMb`:** Total V8 heap memory allocated by the operating system.

### C. Server Uptime & Node Environment
- **`uptimeSeconds`:** Continuous running duration of the Node.js application process.
- **`nodeVersion`:** Current runtime version (e.g., `v22.x`).
- **`timestamp`:** High-resolution ISO timestamp for diagnostic clock drift verification.

### D. Centralized File Storage Vault Health
Verifies disk reachability and write permissions for the `/uploads` private file directory where project deliverables, invoices, and review assets reside.

---

## 3. Zero Credential Leakage Assurance

The endpoint response strictly omits:
- MongoDB connection URIs, database passwords, or replica set replica hostnames.
- Host machine private IPs or internal VPC configuration.
- JWT signing secrets, API keys, or operational tokens.
