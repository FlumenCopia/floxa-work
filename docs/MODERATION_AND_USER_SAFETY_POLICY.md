# FLOXA WORK — MODERATION AND USER SAFETY POLICY
## User Reporting, Mutual Blocking & Platform Safety Architecture

**Version:** 1.0.0  
**Date:** 14 November 2026  
**Status:** Production Standard  

---

## 1. Safety Principles

FLOXA Work maintains a high-trust professional ecosystem where collaboration is safe, transparent, and respectful. The platform provides:
1. Universal item & user reporting.
2. User-initiated blocking with contract isolation.
3. Administrative operations queues for KYC, disputes, reports, and reviews.

---

## 2. User Reporting System

Users can flag any inappropriate item across 5 target types:
- `user`: Harassment, impersonation, or offensive conduct.
- `review`: Retaliatory, defamatory, or fraudulent statements.
- `contract`: Terms violation or non-compliance.
- `message`: Spam, abuse, or off-platform coercion.
- `brief`: Misleading, prohibited, or fake opportunities.

### Workflow:
1. **Submission (`POST /api/safety/report`):** Records evidence URLs, reporter ID, target type, and reason.
2. **Investigation (`GET /api/admin/reports`):** Operations queue triages pending reports.
3. **Resolution (`POST /api/admin/reports/:id/resolve`):** Status moves to `resolved` or `dismissed` with immutable audit logging.

---

## 3. Mutual User Blocking Engine

Users can protect their privacy by blocking another member (`POST /api/safety/block/:userId`):
- **Chat Barrier:** The chat endpoint `POST /api/messages` checks `isBlockedBetween(sender, recipient)`. If either user has blocked the other, message transmission is blocked with HTTP `403 Forbidden`.
- **Invitation Barrier:** The invitation endpoint `POST /api/invitations` checks `isBlockedBetween(client, freelancer)`. Blocked members cannot send project invitations.
- **Contract Preservation:** Blocking does not erase past completed contracts or destroy legal audit trails.
- **Unblocking (`DELETE /api/safety/block/:userId`):** Instantly restores normal communication privileges.
