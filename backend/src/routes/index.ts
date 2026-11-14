import { Router } from 'express';
import {
  register,
  login,
  refreshTokenHandler,
  logout,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  forgotPassword,
  resetPassword,
  requestEmailVerification,
  verifyEmail,
  getMe,
} from '../controllers/auth.controller.js';
import { getSocialFeed, createPost, likePost, getTopTalent } from '../controllers/feed.controller.js';
import { createBrief, getBriefsFeed, getBriefDetails } from '../controllers/brief.controller.js';
import {
  submitMiniDiscoveryProposal,
  getBriefProposals,
  getProposalById,
  shortlistProposal,
  declineProposal,
  withdrawProposal,
  compareProposals,
  getMyProposals,
} from '../controllers/proposal.controller.js';
import {
  acceptProposalAndCreateContract,
  submitMilestoneDeliverable,
  approveMilestoneDeliverable,
  reportMilestonePayment,
  acknowledgeMilestonePayment,
  disputeMilestonePayment,
  getActiveContract,
  getMyContracts,
  getContractDetails,
} from '../controllers/contract.controller.js';
import { getUserProfile, updateUserProfile } from '../controllers/user.controller.js';
import { getMessages, sendMessage } from '../controllers/chat.controller.js';
import {
  uploadMiddleware,
  uploadSingleFile,
  downloadFile,
  viewFile,
} from '../controllers/file.controller.js';
import {
  getAdminPlatformStats,
  getAdminUsers,
  toggleUserVerification,
} from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/security.middleware.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'floxa-work-backend', timestamp: new Date() });
});

// Auth & Advanced Session Management
router.post('/auth/register', authRateLimiter, register);
router.post('/auth/login', authRateLimiter, login);
router.post('/auth/refresh', authRateLimiter, refreshTokenHandler);
router.post('/auth/logout', logout);
router.get('/auth/sessions', requireAuth, getActiveSessions);
router.delete('/auth/sessions/:sessionId', requireAuth, revokeSession);
router.post('/auth/sessions/revoke-all-others', requireAuth, revokeAllOtherSessions);
router.post('/auth/forgot-password', authRateLimiter, forgotPassword);
router.post('/auth/reset-password', authRateLimiter, resetPassword);
router.post('/auth/request-email-verification', requireAuth, requestEmailVerification);
router.post('/auth/verify-email', authRateLimiter, verifyEmail);
router.get('/auth/me', requireAuth, getMe);

// User Profile & Talent Profile Management
router.get('/users/profile', requireAuth, getUserProfile);
router.put('/users/profile', requireAuth, updateUserProfile);

// Social Proof-of-Work Feed & Talent
router.get('/feed', getSocialFeed);
router.post('/feed', requireAuth, createPost);
router.post('/feed/:postId/like', requireAuth, likePost);
router.get('/talent', getTopTalent);

// Briefs
router.post('/briefs', requireAuth, createBrief);
router.get('/briefs', getBriefsFeed);
router.get('/briefs/:idOrToken', getBriefDetails);

// Mini-Discovery Proposals & Proposal Comparison Engine
router.post('/proposals', requireAuth, submitMiniDiscoveryProposal);
router.get('/proposals/me', requireAuth, getMyProposals);
router.post('/proposals/compare', requireAuth, compareProposals);
router.get('/proposals/:id', requireAuth, getProposalById);
router.post('/proposals/:id/shortlist', requireAuth, shortlistProposal);
router.post('/proposals/:id/decline', requireAuth, declineProposal);
router.post('/proposals/:id/withdraw', requireAuth, withdrawProposal);
router.get('/briefs/:briefId/proposals', requireAuth, getBriefProposals);

// Contracts & Direct Milestone Billing (0% Platform Custody)
router.post('/contracts', requireAuth, acceptProposalAndCreateContract);
router.get('/contracts/active', requireAuth, getActiveContract);
router.get('/contracts/me', requireAuth, getMyContracts);
router.get('/contracts/:contractId', requireAuth, getContractDetails);
router.post('/milestones/:milestoneId/deliverable', requireAuth, submitMilestoneDeliverable);
router.post('/milestones/:milestoneId/approve', requireAuth, approveMilestoneDeliverable);
router.post('/milestones/:milestoneId/payment/report', requireAuth, reportMilestonePayment);
router.post('/milestones/:milestoneId/payment/acknowledge', requireAuth, acknowledgeMilestonePayment);
router.post('/milestones/:milestoneId/payment/dispute', requireAuth, disputeMilestonePayment);

// Centralized File Storage (Upload, Download, Inline View)
router.post('/files/upload', requireAuth, uploadMiddleware.single('file'), uploadSingleFile);
router.get('/files/:fileId/download', requireAuth, downloadFile);
router.get('/files/:filename/view', viewFile);

// Live Chat & Direct Consultation Messages
router.get('/messages', requireAuth, getMessages);
router.post('/messages', requireAuth, sendMessage);

// Admin Moderation & Platform Analytics
router.get('/admin/stats', requireAuth, getAdminPlatformStats);
router.get('/admin/users', requireAuth, getAdminUsers);
router.post('/admin/users/:userId/verify', requireAuth, toggleUserVerification);

export default router;
