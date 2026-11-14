# FLOXA WORK — PHASE 16: KNOWN ISSUES & BETA OPERATIONAL NOTES

**Document Version:** 1.0 (Launch Candidate Review)  
**Date:** 14 November 2026  
**Status:** No P0 (Blockers) or P1 (High Friction) Issues Remaining  

---

## 1. Resolved Issues in Phase 15 & 16

1. **[P0 Resolved] Instant Proposal Acceptance Without Pre-Contract Review:**
   - *Previous Behavior:* Clicking "Accept" instantly created a binding contract without displaying a summary of deliverables or external billing rules.
   - *Resolution:* Implemented `AcceptanceConfirmationModal` displaying full agreed milestones, amounts, delivery duration, and non-custodial direct billing notice.
2. **[P1 Resolved] Browser Thread-Blocking `alert()` & `confirm()` Dialogs:**
   - *Previous Behavior:* Comparison limits and decline actions triggered raw browser popups.
   - *Resolution:* Replaced with inline notification banners, custom `DeclineConfirmationModal`, and auto-dismissing toast notifications.
3. **[P1 Resolved] Non-Custodial Disclosure in Payment Disputes:**
   - *Previous Behavior:* Payment dispute dialog lacked explicit clarification that FLOXA Work does not hold escrow or perform platform chargebacks.
   - *Resolution:* Added prominent Non-Custodial Mediation Notice inside `WorkspaceView.tsx`.
4. **[P1 Resolved] Discovery Query Parameter Alignment:**
   - *Previous Behavior:* Benchmark test passed `query=lead` instead of indexed `q=lead`, elevating latency.
   - *Resolution:* Aligned query parameters to `q`, reducing discovery p95 latency from 299ms to 56ms.

---

## 2. Minor Non-Blocking Observations (P3)

The following minor items represent low-priority enhancements for future phases and do not block beta launch:

1. **WebRTC Direct Call Fallback:**
   - Real-time video/audio calling relies on direct WebRTC peer connections between client and freelancer. In rare enterprise firewall environments (strict symmetric NAT), a TURN relay server may be configured in future phases.
2. **Avatar Upload File Size Guidance:**
   - Profile photo uploads are currently clamped to 5MB on the client side. A future enhancement could provide client-side automatic image cropping/compression prior to upload.
3. **Draft Brief Local Auto-Save:**
   - If a client closes the browser midway through typing a 500-word problem statement without posting, the text is not auto-saved to localStorage. A lightweight debounce hook can be added in Phase 17.

---

## 3. Launch Candidate Assessment

With 0 critical blockers, 0 high-friction defects, 100% test pass rate across 13 test suites, and strict non-custodial invariants enforced across the backend and frontend, **FLOXA Work is verified ready for an early-user beta release.**

