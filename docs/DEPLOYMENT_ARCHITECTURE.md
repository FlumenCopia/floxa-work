# FLOXA Work — Deployment Architecture Specification

**Target Environment:** Cloud Production Topology  
**Architecture:** Next.js 16.2 Frontend + Node.js 22 Express Backend + MongoDB Atlas + Cloudflare R2  
**Date:** 14 November 2026  

---

## 1. High-Level Architecture Topology

```
                                  INTERNET
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │      CLOUDFLARE EDGE NETWORK    │
                    │   - DDoS Layer 3/4/7 Protection │
                    │   - WAF & Rate Limiting Rules   │
                    │   - SSL/TLS 1.3 Termination     │
                    └────────┬───────────────┬────────┘
                             │               │
            Static & Client  │               │ API & WebSocket
            Web Traffic      │               │ /api/* & /ws
                             ▼               ▼
         ┌────────────────────────┐      ┌────────────────────────┐
         │     NEXT.JS EDGE       │      │   REVERSE PROXY / ALB  │
         │  (Vercel / Cloudflare) │      │   (NGINX / AWS ALB)    │
         │   - React 19 SSR       │      └───────────┬────────────┘
         │   - Turbopack bundles  │                  │ Proxy pass
         └────────────────────────┘                  ▼
                                         ┌────────────────────────┐
                                         │  EXPRESS API CLUSTER   │
                                         │   (Node.js 22 LTS)     │
                                         │   - 11-Role RBAC       │
                                         │   - WebSocket Room Iso │
                                         │   - Request Tracing    │
                                         └─────┬───────────┬──────┘
                                               │           │
                    Internal VPC               │           │ S3 Protocol
                    Connection Pool            │           │
                                               ▼           ▼
         ┌────────────────────────┐      ┌────────────────────────┐
         │     MONGODB ATLAS      │      │     CLOUDFLARE R2      │
         │   3-Node Multi-AZ      │      │  Private Object Vault  │
         │   Replica Set Cluster  │      │  - NDA Deliverables    │
         │   - TLS In-Transit     │      │  - Payment Receipts    │
         │   - AES-256 at Rest    │      │  - Short-lived URLs    │
         └────────────────────────┘      └────────────────────────┘
```

---

## 2. Infrastructure Specifications

| Component | Technology | Recommended Sizing (Launch) | Redundancy |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | Next.js 16.2 / React 19 | Serverless Edge or 2x 1 vCPU / 2GB RAM | Multi-Region Anycast Edge |
| **Backend API** | Express 4.21 / Node 22 | 2x 2 vCPU / 4GB RAM (e.g. AWS t4g.medium) | Multi-AZ Auto-Scaling Group |
| **Database** | MongoDB Atlas (M10+) | 3-Node Replica Set (Primary + 2 Secondaries) | Cross-AZ with automated failover |
| **Storage Vault**| Cloudflare R2 / S3 | Object storage with private bucket ACL | 99.999999999% Durability |
| **Real-Time WSS**| `ws` on Express port 5001| Sticky sessions on reverse proxy / Redis pubsub | Multi-process worker pool |

