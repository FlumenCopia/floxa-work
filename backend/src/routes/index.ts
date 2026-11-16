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
  changePassword,
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
  searchFreelancers,
  getFreelancerDiscoveryDetails,
  searchProjects,
  getProjectDiscoveryDetails,
  calculateBriefTalentMatch,
} from '../controllers/discovery.controller.js';
import {
  saveFreelancer,
  removeSavedFreelancer,
  getSavedFreelancers,
  saveProject,
  removeSavedProject,
  getSavedProjects,
} from '../controllers/saved.controller.js';
import {
  sendInvitation,
  getInvitations,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
} from '../controllers/invitation.controller.js';
import {
  acceptProposalAndCreateContract,
  submitMilestoneDeliverable,
  approveMilestoneDeliverable,
  requestMilestoneRevision,
  getMilestoneSubmissions,
  reportMilestonePayment,
  acknowledgeMilestonePayment,
  disputeMilestonePayment,
  getActiveContract,
  getMyContracts,
  getContractDetails,
} from '../controllers/contract.controller.js';
import {
  getWorkspaceDetails,
  getContractTasks,
  createContractTask,
  updateTask,
  addTaskComment,
  getContractActivity,
  getContractFiles,
  confirmCloseout,
  getContractMessages,
  sendContractMessage,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/workspace.controller.js';
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
  getMarketplaceAnalytics,
  getAdminContracts,
  getAdminUsers,
  getAdminUserDetails,
  updateUserAccountStatus,
  updateUserRestrictions,
  updateAdminUserRole,
  toggleUserVerification,
  getAdminAuditLogs,
  getSystemHealth,
  exportPlatformData,
} from '../controllers/admin.controller.js';
import { requireAdminPermission } from '../middleware/admin.middleware.js';
import {
  createContractReview,
  getContractReviewStatus,
  getUserReviews,
  editReview,
  autoPublishReview,
  reportReview,
  getAdminReviews,
  moderateReview,
} from '../controllers/review.controller.js';
import {
  openContractDispute,
  getDisputeDetails,
  postDisputeMessage,
  uploadDisputeEvidence,
  getContractDisputes,
  getAdminDisputes,
  updateDisputeStatus,
  resolveDispute,
} from '../controllers/dispute.controller.js';
import {
  reportUserOrItem,
  getAdminReports,
  resolveAdminReport,
  blockUser,
  unblockUser,
  getBlockedUsers,
} from '../controllers/safety.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
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
router.post('/auth/change-password', requireAuth, changePassword);
router.post('/auth/request-email-verification', requireAuth, requestEmailVerification);
router.post('/auth/verify-email/request', requireAuth, requestEmailVerification);
router.post('/auth/verify-email', authRateLimiter, verifyEmail);
router.get('/auth/me', requireAuth, getMe);

// User Profile & Talent Profile Management
router.get('/users/profile', requireAuth, getUserProfile);
router.put('/users/profile', requireAuth, updateUserProfile);
router.get('/profile', requireAuth, getUserProfile);
router.put('/profile', requireAuth, updateUserProfile);

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
router.post('/briefs/:briefId/proposals', requireAuth, (req, res) => {
  req.body.briefId = req.params.briefId;
  submitMiniDiscoveryProposal(req, res);
});

// Phase 9: Advanced Discovery & Search Engine
router.get('/discovery/freelancers', searchFreelancers);
router.get('/discovery/freelancers/:id', getFreelancerDiscoveryDetails);
router.get('/discovery/projects', searchProjects);
router.get('/discovery/projects/:id', getProjectDiscoveryDetails);
router.get('/discovery/match', calculateBriefTalentMatch);

// Phase 9: Saved Items (Freelancers & Projects)
router.post('/saved/freelancers/:id', requireAuth, saveFreelancer);
router.delete('/saved/freelancers/:id', requireAuth, removeSavedFreelancer);
router.get('/saved/freelancers', requireAuth, getSavedFreelancers);
router.post('/saved/projects/:id', requireAuth, saveProject);
router.delete('/saved/projects/:id', requireAuth, removeSavedProject);
router.get('/saved/projects', requireAuth, getSavedProjects);

// Phase 9: Project Invitations Workflow
router.post('/invitations', requireAuth, sendInvitation);
router.get('/invitations', requireAuth, getInvitations);
router.post('/invitations/:id/accept', requireAuth, acceptInvitation);
router.put('/invitations/:id/accept', requireAuth, acceptInvitation);
router.post('/invitations/:id/decline', requireAuth, declineInvitation);
router.put('/invitations/:id/decline', requireAuth, declineInvitation);
router.post('/invitations/:id/cancel', requireAuth, cancelInvitation);
router.put('/invitations/:id/cancel', requireAuth, cancelInvitation);

// Contracts & Direct Milestone Billing (0% Platform Custody)
router.post('/contracts', requireAuth, acceptProposalAndCreateContract);
router.post('/proposals/:proposalId/accept', requireAuth, (req, res) => {
  req.body.proposalId = req.params.proposalId;
  acceptProposalAndCreateContract(req, res);
});
router.get('/contracts/active', requireAuth, getActiveContract);
router.get('/contracts/me', requireAuth, getMyContracts);
router.get('/contracts/:contractId', requireAuth, getContractDetails);
router.post('/milestones/:milestoneId/deliverable', requireAuth, submitMilestoneDeliverable);
router.post('/milestones/:milestoneId/submissions', requireAuth, submitMilestoneDeliverable);
router.get('/milestones/:milestoneId/submissions', requireAuth, getMilestoneSubmissions);
router.post('/milestones/:milestoneId/revisions', requireAuth, requestMilestoneRevision);
router.post('/milestones/:milestoneId/approve', requireAuth, approveMilestoneDeliverable);
router.post('/milestones/:milestoneId/payment/report', requireAuth, reportMilestonePayment);
router.post('/milestones/:milestoneId/payment/acknowledge', requireAuth, acknowledgeMilestonePayment);
router.post('/milestones/:milestoneId/payment/dispute', requireAuth, disputeMilestonePayment);

// Phase 10: Project Workspace, Task Management & Activity Timeline
router.get('/contracts/:contractId/workspace', requireAuth, getWorkspaceDetails);
router.get('/contracts/:contractId/tasks', requireAuth, getContractTasks);
router.post('/contracts/:contractId/tasks', requireAuth, createContractTask);
router.patch('/tasks/:taskId', requireAuth, updateTask);
router.put('/tasks/:taskId', requireAuth, updateTask);
router.post('/tasks/:taskId/comments', requireAuth, addTaskComment);
router.get('/contracts/:contractId/activity', requireAuth, getContractActivity);
router.get('/contracts/:contractId/files', requireAuth, getContractFiles);
router.post('/contracts/:contractId/closeout', requireAuth, confirmCloseout);
router.get('/contracts/:contractId/messages', requireAuth, getContractMessages);
router.post('/contracts/:contractId/messages', requireAuth, sendContractMessage);

// Phase 10: User & Project Notifications
router.get('/notifications', requireAuth, getNotifications);
router.patch('/notifications/:notificationId/read', requireAuth, markNotificationRead);
router.post('/notifications/:notificationId/read', requireAuth, markNotificationRead);
router.post('/notifications/read-all', requireAuth, markAllNotificationsRead);

// Centralized File Storage (Upload, Download, Inline View)
router.post('/files/upload', requireAuth, uploadMiddleware.single('file'), uploadSingleFile);
router.get('/files/:fileId/download', optionalAuth, downloadFile);
router.get('/files/:fileId/view', optionalAuth, viewFile);
router.get('/files/:filename/view', optionalAuth, viewFile);

// Live Chat & Direct Consultation Messages
router.get('/messages', requireAuth, getMessages);
router.post('/messages', requireAuth, sendMessage);

// Admin Operations, Platform Analytics & Governance (Phase 12)
router.get('/admin/stats', requireAuth, requireAdminPermission('analytics:view'), getAdminPlatformStats);
router.get('/admin/analytics/overview', requireAuth, requireAdminPermission('analytics:view'), getAdminPlatformStats);
router.get('/admin/analytics/marketplace', requireAuth, requireAdminPermission('analytics:view'), getMarketplaceAnalytics);
router.get('/admin/contracts', requireAuth, requireAdminPermission('contracts:view'), getAdminContracts);
router.get('/admin/users', requireAuth, requireAdminPermission('users:view'), getAdminUsers);
router.get('/admin/users/:userId', requireAuth, requireAdminPermission('users:view'), getAdminUserDetails);
router.post('/admin/users/:userId/verify', requireAuth, requireAdminPermission('users:manage'), toggleUserVerification);
router.patch('/admin/users/:userId/status', requireAuth, requireAdminPermission('users:manage'), updateUserAccountStatus);
router.put('/admin/users/:userId/status', requireAuth, requireAdminPermission('users:manage'), updateUserAccountStatus);
router.post('/admin/users/:userId/restrictions', requireAuth, requireAdminPermission('users:manage'), updateUserRestrictions);
router.put('/admin/users/:userId/restrictions', requireAuth, requireAdminPermission('users:manage'), updateUserRestrictions);
router.patch('/admin/users/:userId/admin-role', requireAuth, requireAdminPermission('roles:manage'), updateAdminUserRole);
router.put('/admin/users/:userId/admin-role', requireAuth, requireAdminPermission('roles:manage'), updateAdminUserRole);
router.get('/admin/audit-logs', requireAuth, requireAdminPermission('audit:view'), getAdminAuditLogs);
router.get('/admin/system-health', requireAuth, requireAdminPermission('health:view'), getSystemHealth);
router.get('/admin/exports/:type', requireAuth, requireAdminPermission('exports:generate'), exportPlatformData);

// Phase 11: Trust, Reputation & Verified Reviews (Double-Blind)
router.post('/contracts/:contractId/reviews', requireAuth, createContractReview);
router.post('/reviews', requireAuth, createContractReview);
router.get('/contracts/:contractId/reviews/status', requireAuth, getContractReviewStatus);
router.get('/users/:userId/reviews', getUserReviews);
router.put('/reviews/:reviewId', requireAuth, editReview);
router.post('/reviews/:reviewId/report', requireAuth, reportReview);
router.post('/reviews/:reviewId/publish', requireAuth, autoPublishReview);
router.get('/admin/reviews', requireAuth, getAdminReviews);
router.post('/admin/reviews/:reviewId/moderate', requireAuth, moderateReview);

// Phase 11: Dispute Resolution & Evidence Mediation (0% Escrow Custody)
router.post('/contracts/:contractId/disputes', requireAuth, openContractDispute);
router.post('/disputes', requireAuth, openContractDispute);
router.get('/contracts/:contractId/disputes', requireAuth, getContractDisputes);
router.get('/disputes/:disputeId', requireAuth, getDisputeDetails);
router.post('/disputes/:disputeId/messages', requireAuth, postDisputeMessage);
router.post('/disputes/:disputeId/evidence', requireAuth, uploadDisputeEvidence);
router.patch('/disputes/:disputeId/status', requireAuth, updateDisputeStatus);
router.post('/disputes/:disputeId/status', requireAuth, updateDisputeStatus);
router.get('/admin/disputes', requireAuth, getAdminDisputes);
router.post('/admin/disputes/:disputeId/resolve', requireAuth, resolveDispute);

// Phase 11: User Safety, Reporting & User Blocking
router.post('/safety/report', requireAuth, reportUserOrItem);
router.get('/admin/reports', requireAuth, getAdminReports);
router.post('/admin/reports/:reportId/resolve', requireAuth, resolveAdminReport);
router.post('/safety/block/:userId', requireAuth, blockUser);
router.post('/safety/block', requireAuth, blockUser);
router.delete('/safety/block/:userId', requireAuth, unblockUser);
router.get('/safety/blocked', requireAuth, getBlockedUsers);

export default router;
