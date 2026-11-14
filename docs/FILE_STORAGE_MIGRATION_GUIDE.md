# FLOXA Work — File Storage Production Migration & Architecture Guide

**Component:** File Management & Centralized Deliverable Vault  
**Security Standard:** Private-By-Default Object Architecture  
**Provider Options:** Local Disk Vault (`local`) | Cloudflare R2 / AWS S3 (`s3`)  
**Date:** 14 November 2026  

---

## 1. Architectural Philosophy: Private-By-Default Deliverables

In freelance project agreements, deliverables often consist of confidential source code, design system vector files, intellectual property, financial receipts, and NDA-guarded project assets.

### Core Storage Constraints:
1. **Zero Public Bucket Access:** Object buckets must never be configured with public read access (`ACL: private`, `BlockPublicAcls: true`).
2. **Authorization Enforcement:** Every request to view or stream a file (`GET /api/files/:filename/view`) must authenticate the user and verify contract participation (Client, Freelancer, or Platform Admin).
3. **Storage Abstraction:** The backend application interacts solely through the `IStorageProvider` interface (`upload`, `getReadStream`, `getSignedUrl`, `delete`), decoupling the file controller from specific disk directories or cloud SDKs.
4. **Backward Compatibility:** The storage adapter automatically checks both the new private vault (`media/private_vault/`) and legacy paths (`media/uploads/`) during migration so existing files remain accessible.

---

## 2. Cloudflare R2 / AWS S3 Production Migration

### Environment Setup for Cloudflare R2
Cloudflare R2 provides zero-egress fee object storage with native S3 API compatibility.

```bash
# Add to production deployment environment:
STORAGE_PROVIDER=s3
S3_ENDPOINT=https://<your-cloudflare-account-id>.r2.cloudflarestorage.com
S3_BUCKET=floxa-work-deliverables-production
S3_REGION=auto
S3_ACCESS_KEY_ID=<r2-api-access-key-id>
S3_SECRET_ACCESS_KEY=<r2-api-secret-access-key>
```

### Migration Verification Status
- **Local Private Vault Adapter:** Fully operational and tested.
- **S3/R2 Adapter:** Fully implemented; health endpoint reports `status: 'unverified'` if credentials are not configured, maintaining non-breaking zero-downtime operations.
