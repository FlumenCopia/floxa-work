# FLOXA Work — End-to-End Workflow Audit & Testing Matrix

**Date:** 2026-11-14  
**Scope:** Client and Freelancer End-to-End Journeys  

---

## 1. Journey A: Client Workflow Audit

| Step # | User Action | Current Technical Implementation | Working Status | Defect / Improvement Required |
|---|---|---|---|---|
| **C-1** | Client Registration / Login | `AuthScreen.tsx` -> `POST /api/auth/login` | Working | Remove demo test pills from production view; add password reset. |
| **C-2** | Client Dashboard Overview | `ClientDashboard.tsx` -> `GET /api/briefs`, `GET /api/proposals/me` | Working | Connect KPI cards to real server-side aggregated metrics. |
| **C-3** | Client Posts Brief | `PostBriefModal.tsx` -> `POST /api/briefs` | Working | Support real file attachment uploads for project specifications. |
| **C-4** | Review Mini-Discovery Proposals | `ClientDashboard.tsx` -> Tab: "Review Proposals" | Working | Allow comparing multiple proposals side-by-side with score metrics. |
| **C-5** | Schedule / Conduct Video Call | `ChatView.tsx` -> WebSockets `call_user` / WebRTC | Working | Add call duration recording and post-call notes. |
| **C-6** | Accept Proposal & Pay Advance | `ClientDashboard.tsx` -> `POST /api/contracts` | Working | Atomically creates contract, sets Milestone 1 to `released`. |
| **C-7** | Inspect Milestone Deliverable | `WorkspaceView.tsx` | Working | Deliverable inspection needs verified file download link. |
| **C-8** | Approve Milestone & Pay Direct | `WorkspaceView.tsx` -> `POST /api/milestones/:id/approve` | Working | Milestone 2 & 3 approve and disburse directly without escrow hold. |
| **C-9** | Direct Payment Ledger Review | `PaymentLedgerView.tsx` -> `GET /api/contracts/active` | Working | Ensure all past contracts are listed with downloadable receipt. |

---

## 2. Journey B: Freelancer Workflow Audit

| Step # | User Action | Current Technical Implementation | Working Status | Defect / Improvement Required |
|---|---|---|---|---|
| **F-1** | Freelancer Registration / Login | `AuthScreen.tsx` -> `POST /api/auth/login` | Working | Profile initialization needs auto-created `TalentProfile`. |
| **F-2** | Profile & Portfolio Management | `ProfileView.tsx` -> `GET /api/users/profile`, `PUT /api/users/profile` | Working | Add full image upload for avatar and multi-image portfolio case studies. |
| **F-3** | Explore Briefs Feed | `BriefsView.tsx` -> `GET /api/briefs?category=...` | Working | Support search filtering, pagination, and saved briefs. |
| **F-4** | Submit Mini-Discovery Pitch | `MiniDiscoveryModal.tsx` -> `POST /api/proposals` | Working | Form validates problem diagnosis, slider, and 3-milestone splits. |
| **F-5** | Track Pitches & Contracts | `WorkspaceView.tsx` / `page.tsx` ("My Pitches") | Working | Real-time status updates via WebSocket system notifications. |
| **F-6** | Submit Handover Deliverable | `WorkspaceView.tsx` -> `POST /api/milestones/:id/deliverable` | Working | Allow uploading `.zip`, `.pdf`, `.fig` files with progress bar. |
| **F-7** | Direct Payment Receipt | `PaymentLedgerView.tsx` | Working | Displays `DIRECT_PAY_...` transaction references in table. |
| **F-8** | Share Proof of Work | `FeedView.tsx` -> `POST /api/feed` | Working | Add image upload, case study tags, and comment interactions. |

---

## 3. Journey C: Real-Time Telephony & Chat Audit

| Feature | Protocol / Transport | Current Implementation | Status | Enhancement |
|---|---|---|---|---|
| **Persistent Online Status** | WebSockets on `/ws` | App-level connection in `page.tsx`, 20s heartbeat | Working | Authenticate connection with JWT token; prune stale sessions. |
| **Direct Messaging** | WebSocket `chat_message` + Mongo persistence | `ChatMessage` collection, real-time message bubble | Working | Add file/image attachments and read receipts. |
| **Incoming Call Signaling** | WebSocket `call_user` / `call_accepted` | Synthesizes dual-tone telephone chime | Working | STUN/TURN server configuration fallback. |
| **Screening Video Call** | WebRTC PeerConnection | Local/remote canvas, mic/video toggles, timer | Working | Network reconnection handling & disconnect cleanup. |
| **Notification Center** | WebSocket `system_notification` | Floating toasts + bell dropdown drawer | Working | Mark as read persistence and notification categories. |

