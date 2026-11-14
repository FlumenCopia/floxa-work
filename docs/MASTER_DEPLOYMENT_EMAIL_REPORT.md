# FLOXA WORK — MASTER DEPLOYMENT TRANSACTIONAL EMAIL REPORT

**Email Service:** `EmailService` (`backend/src/services/email/`)  
**Host Environment:** Hostinger Ubuntu VPS (`89.116.121.25`)  
**Config Options:** Resend API / Hostinger SMTP / Console Logger Fallback  

---

## 1. Provider Configuration Options in `/etc/floxa/backend.env`

### Option 1: Hostinger Business Email (Included with Hostinger VPS)
```ini
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@floxa.work
SMTP_PASS=<HOSTINGER_EMAIL_PASSWORD>
EMAIL_FROM="FLOXA Work <noreply@floxa.work>"
```

### Option 2: Resend API
```ini
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_123456789...
EMAIL_FROM="FLOXA Work <noreply@mail.floxa.work>"
```

### Option 3: Interim Console Logging Mode (No External Credential Dependency)
```ini
EMAIL_PROVIDER=log
EMAIL_FROM="FLOXA Work <noreply@floxa.work>"
```

---

## 2. Safe Beta Onboarding Alternative

When `EMAIL_PROVIDER=log`, email verification links and password resets are printed to the backend system journal (`journalctl -u floxa-backend`). This allows invited beta users to be onboarded directly by an administrator without external email dispatch failures.
