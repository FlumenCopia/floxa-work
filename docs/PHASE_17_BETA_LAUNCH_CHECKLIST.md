# FLOXA WORK — PHASE 17 BETA LAUNCH READINESS CHECKLIST

**Target:** Controlled Beta Launch with 10–25 Trusted Early Clients & Freelancers  
**Status:** Verification Completed  

---

## 1. Technical & Infrastructure Readiness

- [x] **Git Repository State:** Clean working tree on `master` at confirmed checkpoints.
- [x] **Backend Build:** TypeScript builds cleanly without errors (`npm run build`).
- [x] **Frontend Build:** Next.js 16.2 Turbopack builds with 0 errors and 100% static generation.
- [x] **Database & Pooling:** Local MongoDB operational with lean connection bounds (`DB_MAX_POOL_SIZE: 25`).
- [x] **Fail-Fast Configuration:** `env.ts` enforces high-entropy JWT secrets and production invariants.
- [x] **Health Telemetry:** `/health/live` (3.8ms) and `/health/ready` (10ms) probes responding with 200 OK.
- [x] **Backup Verification:** Automated database backup (`scripts/backup-database.cjs`) and test restore (`scripts/restore-database.cjs`) verified with matching SHA-256 checksums.
- [x] **Automated Regression Testing:** 13 test suites (125 specs) passing with 100% success.
- [x] **Accessibility Standard:** WCAG 2.1 AA contrast verified (>16:1 on body, >7.5:1 on secondary text, all images feature `alt` tags).
- [x] **Responsive Viewports:** 360px, 390px, 430px, 768px, 1024px, 1440px+ verified with zero horizontal overflow.

---

## 2. Operational & Support Readiness

- [x] **Non-Custodial Legal Notice:** Drafted and integrated into brief posting, proposal comparison, contract acceptance, and payment dispute dialogs.
- [x] **Customer Support SOP:** Dispute review, safety reporting, and user suspension runbooks documented in `docs/PHASE_17_BETA_SUPPORT_PLAYBOOK.md`.
- [x] **Metrics Integrity:** Beta analytics separate contractual work value from company revenue in `docs/PHASE_17_BETA_METRICS.md`.
- [x] **Onboarding Journeys:** Documented for both Client and Freelancer roles in `docs/PHASE_17_EMAIL_AND_ONBOARDING.md`.

---

## 3. Mandatory Steps Before Production Deployment (Human Action Required)

The following manual prerequisites must be completed by human platform operators before admitting live public users:

1. **Production Infrastructure Provisioning:**
   - Create accounts on Vercel (Frontend) and Railway (Backend).
   - Create a MongoDB Atlas cluster and whitelist Railway server egress IPs.
   - Attach a Cloudflare R2 bucket for private file vault storage.
2. **Domain & DNS Setup:**
   - Configure DNS records for `app.floxa.work` (CNAME to Vercel) and `api.floxa.work` (CNAME to Railway).
3. **Transactional Email Credentials:**
   - Create a Resend or SendGrid account.
   - Verify domain DNS records (SPF, DKIM, DMARC) for `notifications@floxa.work`.
   - Add `RESEND_API_KEY` or `SMTP_*` credentials to backend environment variables.
4. **Qualified Legal Review:**
   - Submit policy drafts in `docs/PHASE_17_POLICY_DRAFTS.md` to qualified legal counsel for jurisdiction-specific review before public signoff.

