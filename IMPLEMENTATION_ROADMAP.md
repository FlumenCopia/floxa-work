# FLOXA Work — Implementation Roadmap & Execution Plan

**Date:** 2026-11-14  
**Target:** Full Commercial Production Readiness  

---

## Roadmap Phases & Task Breakdown

### Stage 1: Design System & Visual Redesign
- [ ] Refactor `frontend/app/globals.css`:
  - Define strict CSS variables: `--primary: #0084FF`, `--primary-hover: #0070E0`, `--navy: #0F172A`, `--slate-secondary: #475569`, `--slate-muted: #94A3B8`, `--bg-surface: #FFFFFF`, `--bg-app: #F8FAFC`, `--border: #E2E8F0`.
  - Remove excessive glassmorphism, glowing halos, and decorative emojis.
  - Standardize button heights: 42px desktop, 46px mobile touch targets.
  - Standardize input styling with clean focus rings.
- [ ] Polish `FloxaWorkShell.tsx`:
  - Enforce clean sidebar aesthetics.
  - Fix topbar search collision at 768px-1024px.
  - Ensure mobile down-nav is hidden on `lg:` viewports.
  - Add safe-area padding for mobile.

### Stage 2: Centralized Real File Storage Infrastructure
- [ ] Create `backend/src/models/File.model.ts`:
  - Schema: `ownerId`, `filename`, `originalName`, `mimeType`, `sizeBytes`, `category`, `storagePath`, `accessUrl`.
- [ ] Configure Multer Upload Middleware:
  - Strict MIME whitelist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `application/zip`).
  - File size limits: 5MB for images, 25MB for archives/docs.
  - Safe sanitized filenames with UUIDs.
- [ ] Implement File API Routes:
  - `POST /api/files/upload`: authenticated multipart upload returning file metadata.
  - `GET /api/files/:fileId/download`: authenticated download streaming with access checks.
- [ ] Frontend Upload Integration:
  - Profile avatar upload.
  - Portfolio project image uploads.
  - Brief attachment uploads.
  - Deliverable file upload in `WorkspaceView.tsx`.
  - Chat attachment uploads in `ChatView.tsx`.

### Stage 3: Authentication, Security & Session Hardening
- [ ] Express Security Middleware:
  - Add `helmet` to `app.ts`.
  - Add `express-rate-limit` for login/registration (10 per 15 min) and API (100 per min).
- [ ] Auth Hardening:
  - Increase bcrypt salt rounds to 12.
  - Password reset endpoints: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`.
  - Sanitize user outputs across all population queries (`.select('-passwordHash')`).
- [ ] WebSocket Handshake Authentication:
  - Verify JWT token during WebSocket connection setup.
  - Disconnect unauthenticated sockets.

### Stage 4: Workflow Completeness & Feature Enhancements
- [ ] Portfolio Project Management:
  - Add Portfolio model or embedded array with title, description, cover image, tools, external URL.
  - Portfolio project CRUD in `ProfileView.tsx`.
- [ ] Contract & Milestone Handover:
  - Verify deliverable upload and inspection with real file download streaming.
  - Milestone approvals record direct dispatches with transaction log.
- [ ] Social Proof Feed:
  - Add post comments/discussion feature.
  - Add image upload to post creation modal.
- [ ] Search & Marketplace Discovery:
  - Add debounced search query across briefs and talent.
  - Advanced filters by budget range, timeline, and category.

### Stage 5: Administration & Moderation Portal
- [ ] Create `backend/src/controllers/admin.controller.ts`:
  - Endpoints: Platform metrics, user list, verify user, suspend user, contract dispute resolution.
- [ ] Create `frontend/components/AdminPortal.tsx`:
  - Accessible only to users with `role: 'admin'`.

### Stage 6: Automated Testing & Verification
- [ ] Backend Integration Tests:
  - Test auth, briefs, proposals, contracts, milestone direct pay, file uploads, and profile updates.
- [ ] Run end-to-end audit verification script.
- [ ] Production build verification: `npm run build` on backend and frontend.

