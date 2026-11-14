# FLOXA Work — Early-Stage Operations Guide

**Purpose:** Day-to-Day Maintenance, Account Administration & Database Backups  
**Audience:** Platform Operators, Support Leads, Founders  
**Date:** 14 November 2026  

---

## 1. Routine Operational Workflows

### A. Database Backups
- **Atlas Automated Backups:** If using MongoDB Atlas M2+, automated daily snapshots are captured and retained for 7 days with point-in-time recovery.
- **Manual / Standalone Backup:** Run the automated backup utility before major updates:
  ```bash
  npm run backup --prefix backend
  # or
  node backend/scripts/backup-database.cjs
  ```
  Archives are saved to `backend/backups/` with a SHA-256 checksum and excluded from Git.

### B. User Moderation & Safety Administration
Operators manage users via the Admin Portal (`/admin` tab):
- **Account Suspension:** When a bad actor is detected, operators apply a reason-backed suspension. The user is instantly blocked from logging in with HTTP 403, and active refresh token families are revoked.
- **Communication Restrictions:** If an account is undergoing dispute triage, operators can apply `messagingRestricted` or `invitationsRestricted` without full login deactivation.
- **Dispute Resolution:** In the Disputes tab, moderators can view contract milestones, communicate with both parties, record confidential internal moderator notes, and finalize milestone resolutions.

### C. Review Moderation
Verified reviews submitted post-project closeout operate under a double-blind holding period (both parties must submit reviews or 14 days must elapse before publication). If a review violates community guidelines, moderators can flag or hide it, which automatically excludes it from the talent's aggregate reputation score.

---

## 2. Emergency Operational Playbook

### High Database Connection Usage
If MongoDB Atlas alerts that connections are high:
1. Confirm that `DB_MAX_POOL_SIZE` is set to `25` (the default).
2. Check for stalled background queries via the MongoDB Atlas Performance Advisor.
3. Trigger a rolling restart of the backend service via the hosting dashboard.

### Suspected Token Breach / Account Takeover
1. Navigate to User Administration in the Admin Portal.
2. Toggle the user's status to `suspended` with a documented reason.
3. This revokes all active session families in MongoDB immediately.

