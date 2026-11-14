# FLOXA Work — WebSocket & WebRTC Real-Time Architecture & Deployment Guide

**Components:** Native WebSockets (`ws` v8.x) & WebRTC Peer-to-Peer Signaling  
**Protocols:** `WSS` (WebSocket Secure) & `WebRTC` (DataChannel / MediaStream)  
**Security Tier:** JWT-Authenticated Connections & Room Boundary Isolation  
**Date:** 14 November 2026  

---

## 1. WebSocket Production Topology

FLOXA Work utilizes a lightweight, native WebSocket server mounted on the same HTTP listener at `/ws`.

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT BROWSER                        │
│   wss://floxa.work/ws?token=<jwt_access_token>              │
└──────────────────────────────┬──────────────────────────────┘
                               │ TLS 1.3 Termination (Port 443)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 REVERSE PROXY (NGINX / ALB)                 │
│   - Connection: "Upgrade"                                   │
│   - Upgrade: "websocket"                                    │
│   - Proxy read timeout: 3600s                               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Reverse Proxy (Port 5001)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 NODE.JS / EXPRESS APP PROCESS               │
│   - ws server with 64KB max payload                         │
│   - Server-side contract participant verification           │
│   - 25s ping/pong dead socket termination                   │
└─────────────────────────────────────────────────────────────┘
```

### Server Hardening Features Implemented:
1. **64KB Max Payload Enforcement:** Mitigates memory exhaustion denial-of-service attempts.
2. **Server-Side Room Authorization:** Clients attempting to join contract rooms (`contract:<id>`, `workspace:<id>`) must supply a cryptographically valid JWT token and be verified in MongoDB as an active participant (Client, Freelancer, or Platform Admin).
3. **Heartbeat & Zombie Pruning:** The server pings connected sockets every 25 seconds; sockets failing to reply with `pong` are terminated.
4. **Graceful Draining:** On `SIGTERM` or `SIGINT`, active socket connections receive a termination notice before closing.

---

## 2. WebRTC Peer-to-Peer Audio/Video & STUN/TURN Traversal

### NAT Traversal Architecture
WebRTC audio and video calls operate peer-to-peer directly between client browsers.

1. **Signaling Exchange:** The WebSocket server relays SDP Offers, SDP Answers, and ICE Candidates.
2. **STUN Servers:** Used to discover public IP and port mappings across non-symmetric NATs.
   - Default: `stun:stun.l.google.com:19302`, `stun:stun1.l.google.com:19302`.
3. **TURN Server Requirement for Symmetric NATs:**
   - In enterprise or restricted mobile networks, peer-to-peer UDP is blocked. A TURN (Traversal Using Relays around NAT) relay is mandatory.
   - Recommended Production TURN Services: Cloudflare Calls, Twilio Network Traversal, or self-hosted `coturn`.
   - **Zero Hardcoded Secrets:** TURN credentials must be generated dynamically as short-lived ephemeral tokens (valid for 1–2 hours) and never hardcoded in client bundles.

