# FLOXA Work — Admin Role Hierarchy & Permission Matrix

**Architecture Tier:** Governance & Platform Operations  
**Compliance Standard:** Principle of Least Privilege (PoLP)  
**Authentication Standard:** Cryptographic JWT Claim Verification with Server-Side Authorization Middleware  
**Date:** 14 November 2026  

---

## 1. Executive Summary

FLOXA Work employs a strict five-tier administrative role hierarchy designed to prevent privilege escalation, enforce separation of duties, and protect platform data integrity. Every administrative endpoint is guarded by the `requireAdminPermission(permission)` middleware, which validates both the authenticated user's base role (`admin`) and their specific administrative sub-role permissions against an immutable server-side permission dictionary.

---

## 2. Administrative Role Hierarchy

The platform defines five distinct administrative sub-roles:

| Sub-Role Identifier | Title | Functional Scope |
| :--- | :--- | :--- |
| `super_admin` | **Super Administrator** | Full platform authority, sub-role assignment, suspension, configuration, audit trail oversight, and data export. |
| `operations_admin` | **Operations Administrator** | Contract monitoring, project pipeline oversight, brief lifecycle management, operational risk handling, and operational exports. |
| `trust_safety_moderator` | **Trust & Safety Moderator** | Dispute resolution, user safety reporting triage, review flagging/moderation, and communication restriction enforcement. |
| `support_operator` | **Customer Support Operator** | User inspection, ticket resolution, customer correspondence, non-destructive user assistance. Read-only audit access. |
| `analytics_viewer` | **Marketplace Analytics Viewer** | Read-only executive dashboard, funnel conversion metrics, category breakdown, and diagnostic health statistics. |

---

## 3. Granular Permission Definitions

The system implements 11 atomic administrative permissions:

1. `analytics:view`: Read executive platform statistics, category analytics, and funnel conversions.
2. `contracts:manage`: Inspect project contracts, milestones, and deliverable execution timelines.
3. `users:view`: Search and inspect user accounts (safe projection without credential exposure).
4. `users:manage`: Suspend, reinstate, or deactivate user accounts (requires documented reason).
5. `users:restrict`: Enforce messaging or invitation restrictions on flagged user profiles.
6. `disputes:manage`: Adjudicate project disagreements, resolve milestones, record internal moderator notes.
7. `reports:manage`: Investigate and resolve user safety, harassment, or spam reports.
8. `reviews:moderate`: Hide, restore, or flag verified client/freelancer reviews.
9. `audit:view`: Query the immutable platform audit log explorer.
10. `system:health`: Inspect real-time server diagnostics (MongoDB ping latency, memory, uptime).
11. `exports:generate`: Download sanitized CSV datasets with spreadsheet formula injection protection.
12. `roles:manage`: Assign or modify administrative sub-roles (**Strictly restricted to `super_admin`**).

---

## 4. Full Permission Matrix

| Permission | `super_admin` | `operations_admin` | `trust_safety_moderator` | `support_operator` | `analytics_viewer` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `analytics:view` | ✅ | ✅ | ❌ | ❌ | ✅ |
| `contracts:manage` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `users:view` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `users:manage` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users:restrict` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `disputes:manage` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `reports:manage` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `reviews:moderate` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `audit:view` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `system:health` | ✅ | ✅ | ❌ | ❌ | ✅ |
| `exports:generate` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `roles:manage` | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 5. Privilege Escalation Prevention Architecture

To prevent horizontal and vertical privilege escalation:
1. **Self-Modification Block:** Administrative users cannot elevate their own permissions or reassign their own sub-roles.
2. **Sub-Role Modification Constraint:** Only an active user possessing the `super_admin` role can invoke `PUT /api/admin/users/:userId/role`.
3. **Database Assertion:** Middleware queries the database to confirm that the requesting user's status is `active` and has not been revoked or suspended.
4. **JWT Claim Refresh:** When an admin's role is updated, existing tokens expire or become invalid upon refresh token rotation.
5. **Audit Logging:** Every attempt to update an administrative role—whether successful or rejected—is logged to the immutable `AuditLog` collection.

