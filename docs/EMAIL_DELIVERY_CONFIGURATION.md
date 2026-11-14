# FLOXA Work — Email Delivery Architecture & Production Setup

**Service:** Transactional Email & Security Notifications  
**Supported Providers:** SMTP (Mailgun, Amazon SES, Postmark) | Resend | SendGrid | Log (Dev)  
**Date:** 14 November 2026  

---

## 1. Architectural Role & Email Categories

FLOXA Work relies on transactional emails strictly for security, authentication, and critical project lifecycle alerts:

1. **Authentication:** Single-use password reset tokens and email verification links.
2. **Security Alerts:** New device logins, password modifications, and account suspension notifications.
3. **Collaboration:** Project invitations, deliverable revision requests, and dispute escalation alerts.

---

## 2. Configuration Matrix

### Production SMTP (e.g. Mailgun, SendGrid, Amazon SES)
```bash
EMAIL_PROVIDER=smtp
EMAIL_FROM="FLOXA Work Notifications <no-reply@floxa.work>"
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.floxa.work
SMTP_PASS=<mailgun-smtp-secret-password>
SMTP_SECURE=false
```

### Development & Sandbox Mode
```bash
EMAIL_PROVIDER=log
```
In development or staging environments without SMTP credentials, emails are written cleanly to structured application logs with sensitive token protection.

---

## 3. Production Launch Readiness Status

- **Status:** **UNVERIFIED / PENDING EXTERNAL CREDENTIALS**
- **Assessment:** The application is architected with complete email abstractions (`EmailService`), but requires an active third-party SMTP account (Mailgun/SendGrid/SES) in production before public launch. Persistent in-app notifications and WebSocket alerts operate independently.
