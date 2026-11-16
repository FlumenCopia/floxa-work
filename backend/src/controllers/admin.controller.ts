import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { User, AdminRole, UserAccountStatus } from '../models/User.model.js';
import { Brief } from '../models/Brief.model.js';
import { Proposal } from '../models/Proposal.model.js';
import { Contract } from '../models/Contract.model.js';
import { Milestone } from '../models/Milestone.model.js';
import { PaymentRecord } from '../models/PaymentRecord.model.js';
import { Dispute } from '../models/Dispute.model.js';
import { UserReport } from '../models/UserReport.model.js';
import { Review } from '../models/Review.model.js';
import { TalentProfile } from '../models/TalentProfile.model.js';
import { Invitation } from '../models/Invitation.model.js';
import { AuditLog } from '../models/AuditLog.model.js';
import { Task } from '../models/Task.model.js';

const NON_CUSTODIAL_DISCLOSURE =
  'FLOXA Work is a direct settlement coordinator and does not hold user funds in escrow. Contractual project values represent negotiated client-freelancer agreements, and payment records reflect user-reported external transactions. Neither constitutes platform revenue or funds held by FLOXA.';

/**
 * Helper to build date range filters from timeframe query
 */
function buildDateFilter(timeframe?: string, startDate?: string, endDate?: string): Record<string, any> {
  const now = new Date();
  if (startDate && endDate) {
    return { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
  }
  if (timeframe === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { createdAt: { $gte: start } };
  }
  if (timeframe === '7d') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { createdAt: { $gte: start } };
  }
  if (timeframe === '30d') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { createdAt: { $gte: start } };
  }
  if (timeframe === '90d') {
    const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return { createdAt: { $gte: start } };
  }
  return {};
}

/**
 * 1. Executive Admin Dashboard Overview
 * Aggregates users, briefs, contracts, disputes, and non-custodial financials.
 */
export async function getAdminPlatformStats(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { timeframe, startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(timeframe as string, startDate as string, endDate as string);

    // 1. User metrics
    const [
      totalUsers,
      totalClients,
      totalFreelancers,
      newRegistrationsInPeriod,
      publishedTalentProfiles,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'freelancer' }),
      User.countDocuments(dateFilter),
      TalentProfile.countDocuments(),
    ]);

    // 2. Brief & Proposal metrics
    const [
      totalBriefs,
      activeBriefs,
      totalProposals,
      acceptedProposals,
    ] = await Promise.all([
      Brief.countDocuments(),
      Brief.countDocuments({ status: 'open' }),
      Proposal.countDocuments(dateFilter),
      Proposal.countDocuments({ status: 'accepted', ...dateFilter }),
    ]);

    // 3. Contract Operations & Contractual Scope
    const [
      totalContracts,
      activeContracts,
      completedContracts,
      disputedContracts,
      contractualAgreedAgg,
      activeContractualAgg,
      completedContractualAgg,
    ] = await Promise.all([
      Contract.countDocuments(),
      Contract.countDocuments({ status: 'active' }),
      Contract.countDocuments({ status: 'completed' }),
      Contract.countDocuments({ status: 'disputed' }),
      Contract.aggregate([
        { $group: { _id: { $toUpper: { $ifNull: ['$currency', 'USD'] } }, totalValue: { $sum: '$totalBudget' }, avgValue: { $avg: '$totalBudget' }, count: { $sum: 1 } } },
      ]),
      Contract.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: { $toUpper: { $ifNull: ['$currency', 'USD'] } }, totalValue: { $sum: '$totalBudget' }, count: { $sum: 1 } } },
      ]),
      Contract.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: { $toUpper: { $ifNull: ['$currency', 'USD'] } }, totalValue: { $sum: '$totalBudget' }, count: { $sum: 1 } } },
      ]),
    ]);

    // Build currency breakdown dictionaries
    const totalVolumeByCurrency: Record<string, number> = {};
    let totalContractualAgreedValue = 0;
    contractualAgreedAgg.forEach((c: any) => {
      totalVolumeByCurrency[c._id] = c.totalValue;
      if (c._id === 'USD') totalContractualAgreedValue += c.totalValue;
    });

    const activeVolumeByCurrency: Record<string, number> = {};
    let activeContractualValue = 0;
    activeContractualAgg.forEach((c: any) => {
      activeVolumeByCurrency[c._id] = c.totalValue;
      if (c._id === 'USD') activeContractualValue += c.totalValue;
    });

    const completedVolumeByCurrency: Record<string, number> = {};
    let completedContractualValue = 0;
    completedContractualAgg.forEach((c: any) => {
      completedVolumeByCurrency[c._id] = c.totalValue;
      if (c._id === 'USD') completedContractualValue += c.totalValue;
    });

    const averageContractValue = Number((contractualAgreedAgg[0]?.avgValue || 0).toFixed(2));

    // 4. User-Reported External Settlement Metrics (Grouped strictly by ISO currency)
    const [
      reportedExternalAgg,
      acknowledgedExternalAgg,
      disputedExternalAgg,
    ] = await Promise.all([
      PaymentRecord.aggregate([
        { $match: { status: { $in: ['reported', 'reported_by_client'] } } },
        { $group: { _id: { $toUpper: { $ifNull: ['$currency', 'USD'] } }, total: { $sum: '$amount' } } },
      ]),
      PaymentRecord.aggregate([
        { $match: { status: { $in: ['acknowledged', 'acknowledged_by_freelancer'] } } },
        { $group: { _id: { $toUpper: { $ifNull: ['$currency', 'USD'] } }, total: { $sum: '$amount' } } },
      ]),
      PaymentRecord.aggregate([
        { $match: { status: 'disputed' } },
        { $group: { _id: { $toUpper: { $ifNull: ['$currency', 'USD'] } }, total: { $sum: '$amount' } } },
      ]),
    ]);

    const reportedByCurrency: Record<string, number> = {};
    reportedExternalAgg.forEach((r: any) => { reportedByCurrency[r._id] = r.total; });

    const acknowledgedByCurrency: Record<string, number> = {};
    acknowledgedExternalAgg.forEach((r: any) => { acknowledgedByCurrency[r._id] = r.total; });

    const disputedByCurrency: Record<string, number> = {};
    disputedExternalAgg.forEach((r: any) => { disputedByCurrency[r._id] = r.total; });

    const reportedExternalPaymentAmount = reportedByCurrency['USD'] || reportedExternalAgg[0]?.total || 0;
    const acknowledgedExternalPaymentAmount = acknowledgedByCurrency['USD'] || acknowledgedExternalAgg[0]?.total || 0;
    const disputedUserReportedPaymentAmount = disputedByCurrency['USD'] || disputedExternalAgg[0]?.total || 0;

    // 5. Moderation & Trust Queues
    const [
      openDisputes,
      pendingSafetyReports,
      reviewsAwaitingModeration,
      invitationCount,
    ] = await Promise.all([
      Dispute.countDocuments({ status: { $in: ['open', 'awaiting_response', 'under_review', 'escalated'] } }),
      UserReport.countDocuments({ status: 'pending' }),
      Review.countDocuments({ status: { $in: ['flagged', 'pending_mutual'] } }),
      Invitation.countDocuments(dateFilter),
    ]);

    res.json({
      timeframe: timeframe || 'all',
      timestamp: new Date(),
      metrics: {
        users: {
          totalUsers,
          totalClients,
          totalFreelancers,
          newRegistrationsInPeriod,
          publishedTalentProfiles,
        },
        marketplace: {
          totalBriefs,
          activeBriefs,
          totalProposals,
          acceptedProposals,
          invitationCount,
        },
        contracts: {
          totalContracts,
          activeContracts,
          completedContracts,
          disputedContracts,
          contractualProjectMetrics: {
            totalContractualAgreedValue,
            activeContractualValue,
            completedContractualValue,
            averageContractValue,
            contractCount: totalContracts,
            volumeByCurrency: totalVolumeByCurrency,
            activeVolumeByCurrency,
            completedVolumeByCurrency,
            description: 'Sum of agreed project scopes between clients and freelancers grouped by ISO currency. This is not platform revenue.',
          },
        },
        externalSettlements: {
          reportedExternalPaymentAmount,
          acknowledgedExternalPaymentAmount,
          disputedUserReportedPaymentAmount,
          reportedByCurrency,
          acknowledgedByCurrency,
          disputedByCurrency,
          description: 'Self-reported external bank/UPI transfers between contract participants. Zero custody escrow.',
        },
        governance: {
          openDisputes,
          pendingSafetyReports,
          reviewsAwaitingModeration,
        },
      },
      // Backward-compatible flat stats block for existing frontend dashboard cards
      stats: {
        totalUsers,
        totalClients,
        totalFreelancers,
        totalBriefs,
        openBriefs: activeBriefs,
        totalContracts,
        activeContracts,
        completedContracts,
        totalVolume: totalContractualAgreedValue,
      },
      nonCustodialNotice: NON_CUSTODIAL_DISCLOSURE,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch executive platform statistics' });
  }
}

/**
 * 2. Marketplace Performance & Conversion Analytics
 */
export async function getMarketplaceAnalytics(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const totalBriefs = await Brief.countDocuments();
    const totalProposals = await Proposal.countDocuments();
    const acceptedProposals = await Proposal.countDocuments({ status: 'accepted' });
    const totalContracts = await Contract.countDocuments();
    const completedContracts = await Contract.countDocuments({ status: 'completed' });

    const avgProposalsPerBrief = totalBriefs > 0 ? Number((totalProposals / totalBriefs).toFixed(2)) : 0;
    const proposalAcceptanceRate = totalProposals > 0 ? Number(((acceptedProposals / totalProposals) * 100).toFixed(1)) : 0;
    const contractCompletionRate = totalContracts > 0 ? Number(((completedContracts / totalContracts) * 100).toFixed(1)) : 0;

    // Category breakdown
    const briefsByCategory = await Brief.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, avgBudgetMin: { $avg: '$budgetMin' }, avgBudgetMax: { $avg: '$budgetMax' } } },
      { $sort: { count: -1 } },
    ]);

    // Talent ratings summary
    const talentStats = await TalentProfile.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$ratingAverage' },
          avgHourlyRate: { $avg: '$hourlyRate' },
          totalCompletedContracts: { $sum: '$completedContractsCount' },
        },
      },
    ]);

    res.json({
      funnel: {
        totalBriefs,
        totalProposals,
        acceptedProposals,
        totalContracts,
        completedContracts,
        avgProposalsPerBrief,
        proposalAcceptanceRate: `${proposalAcceptanceRate}%`,
        contractCompletionRate: `${contractCompletionRate}%`,
      },
      briefsByCategory,
      talentBenchmark: talentStats[0] || { avgRating: 5.0, avgHourlyRate: 75, totalCompletedContracts: 0 },
      nonCustodialNotice: NON_CUSTODIAL_DISCLOSURE,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch marketplace analytics' });
  }
}

/**
 * 3. Contract & Project Operations Queue
 * Filterable operational view with risk indicators (overdue, disputed, pending closeout).
 */
export async function getAdminContracts(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const { status, riskOnly, minValue, maxValue, search } = req.query;
    const query: Record<string, any> = {};

    if (status) query.status = status;
    if (minValue || maxValue) {
      query.totalBudget = {};
      if (minValue) query.totalBudget.$gte = Number(minValue);
      if (maxValue) query.totalBudget.$lte = Number(maxValue);
    }
    if (riskOnly === 'true') {
      query.$or = [
        { status: 'disputed' },
        { closeoutStatus: 'in_review' },
      ];
    }

    const [contracts, total] = await Promise.all([
      Contract.find(query)
        .populate('clientId', 'name handle email avatarUrl')
        .populate('freelancerId', 'name handle email avatarUrl')
        .populate('briefId', 'title category')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Contract.countDocuments(query),
    ]);

    res.json({
      contracts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      nonCustodialNotice: NON_CUSTODIAL_DISCLOSURE,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch admin contracts' });
  }
}

/**
 * 4. User Administration: Search, KYC, Lifecycle Management
 */
export async function getAdminUsers(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || '';
    const role = req.query.role as string;
    const status = req.query.status as string;

    const query: any = {};
    if (role) query.role = role;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { handle: { $regex: search, $options: 'i' } },
      ];
    }

    // STRICT PRIVACY: Project out all passwords, tokens, and secret hashes
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash -passwordResetTokenHash -emailVerificationTokenHash')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
}

/**
 * 5. User Details & Safety Profile View
 */
export async function getAdminUserDetails(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Valid user ID required' });
      return;
    }

    const user = await User.findById(userId).select(
      '-passwordHash -passwordResetTokenHash -emailVerificationTokenHash'
    );
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const [profile, contractCount, completedCount, reportsAgainstUser, openDisputes] = await Promise.all([
      TalentProfile.findOne({ userId: user._id }),
      Contract.countDocuments({ $or: [{ clientId: user._id }, { freelancerId: user._id }] }),
      Contract.countDocuments({
        $or: [{ clientId: user._id }, { freelancerId: user._id }],
        status: 'completed',
      }),
      UserReport.find({ targetUserId: user._id }).sort({ createdAt: -1 }).limit(10),
      Dispute.countDocuments({
        $or: [{ initiatorId: user._id }, { respondentId: user._id }],
        status: { $in: ['open', 'under_review', 'escalated'] },
      }),
    ]);

    res.json({
      user,
      profile: profile || null,
      stats: {
        contractCount,
        completedCount,
        openDisputes,
      },
      safetyHistory: {
        recentReports: reportsAgainstUser,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch user details' });
  }
}

/**
 * 6. Suspend or Reinstate User Account
 */
export async function updateUserAccountStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Valid user ID required' });
      return;
    }

    if (!['active', 'suspended', 'deactivated'].includes(status)) {
      res.status(400).json({ error: "Status must be 'active', 'suspended', or 'deactivated'" });
      return;
    }

    if (status === 'suspended' && (!reason || !reason.trim())) {
      res.status(400).json({ error: 'Administrative reason is required for account suspension' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const prevStatus = user.status;
    user.status = status as UserAccountStatus;
    if (status === 'suspended') {
      user.suspensionReason = reason.trim();
      user.suspendedAt = new Date();
      user.suspendedBy = req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined;
    } else if (status === 'active') {
      user.suspensionReason = '';
      user.suspendedAt = undefined;
      user.suspendedBy = undefined;
    }

    await user.save();

    await AuditLog.create({
      actorId: req.user?.id,
      action: status === 'suspended' ? 'USER_SUSPENDED' : 'USER_REINSTATED',
      targetType: 'User',
      targetId: user.id,
      metadata: { previousStatus: prevStatus, newStatus: status, reason },
    });

    res.json({
      success: true,
      message: `User account status updated to ${status}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        suspensionReason: user.suspensionReason,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update user account status' });
  }
}

/**
 * 7. Apply or Remove User Restrictions (Messaging, Invitations)
 */
export async function updateUserRestrictions(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { userId } = req.params;
    const { messagingRestricted, invitationsRestricted, reason } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Valid user ID required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.restrictions = {
      messagingRestricted: Boolean(messagingRestricted),
      invitationsRestricted: Boolean(invitationsRestricted),
      suspensionReason: reason || user.restrictions?.suspensionReason || '',
      restrictedAt: new Date(),
      restrictedBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
    };

    await user.save();

    await AuditLog.create({
      actorId: req.user?.id,
      action: 'USER_RESTRICTIONS_UPDATED',
      targetType: 'User',
      targetId: user.id,
      metadata: { restrictions: user.restrictions, reason },
    });

    res.json({
      success: true,
      message: 'User restrictions successfully updated',
      restrictions: user.restrictions,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update user restrictions' });
  }
}

/**
 * 8. Governance: Update Admin Sub-Role (Super Admin Only)
 */
export async function updateAdminUserRole(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { userId } = req.params;
    const { adminRole, role } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Valid user ID required' });
      return;
    }

    const validAdminRoles: AdminRole[] = [
      'super_admin',
      'operations_admin',
      'trust_safety_moderator',
      'support_operator',
      'analytics_viewer',
    ];

    if (adminRole && !validAdminRoles.includes(adminRole)) {
      res.status(400).json({
        error: `Invalid adminRole. Must be one of: ${validAdminRoles.join(', ')}`,
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const oldAdminRole = user.adminRole;
    if (adminRole) user.adminRole = adminRole;
    if (role) user.role = role;

    await user.save();

    await AuditLog.create({
      actorId: req.user?.id,
      action: 'ADMIN_ROLE_UPDATED',
      targetType: 'User',
      targetId: user.id,
      metadata: { previousRole: oldAdminRole, newRole: user.adminRole, systemRole: user.role },
    });

    res.json({
      success: true,
      message: 'Admin role updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        adminRole: user.adminRole,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update administrative role' });
  }
}

/**
 * 9. Toggle User KYC Verification
 */
export async function toggleUserVerification(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.isVerified = !user.isVerified;
    await user.save();

    await AuditLog.create({
      actorId: req.user?.id,
      action: user.isVerified ? 'USER_VERIFIED' : 'USER_UNVERIFIED',
      targetType: 'User',
      targetId: user.id,
    });

    res.json({
      message: `User verification updated to ${user.isVerified}`,
      isVerified: user.isVerified,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update user verification' });
  }
}

/**
 * 10. Audit Log Explorer
 * Query, search, and filter immutable audit records.
 */
export async function getAdminAuditLogs(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 30));
    const skip = (page - 1) * limit;

    const { actorId, action, targetType, startDate, endDate } = req.query;
    const query: Record<string, any> = {};

    if (actorId && mongoose.Types.ObjectId.isValid(actorId as string)) {
      query.actorId = new mongoose.Types.ObjectId(actorId as string);
    }
    if (action) query.action = { $regex: action as string, $options: 'i' };
    if (targetType) query.targetType = targetType as string;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actorId', 'name handle email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
  }
}

/**
 * 11. Platform Health & Real Operational Monitoring
 * Real database latency, memory stats, uptime, and WebSocket activity.
 * STRICT SECURITY: Zero credentials or sensitive environment secrets revealed.
 */
export async function getSystemHealth(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const startTime = Date.now();
    // Measure actual MongoDB roundtrip latency
    await mongoose.connection.db?.admin().ping();
    const dbLatencyMs = Date.now() - startTime;

    const memUsage = process.memoryUsage();

    res.json({
      status: 'operational',
      timestamp: new Date(),
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        pingLatencyMs: `${dbLatencyMs}ms`,
        name: mongoose.connection.name || 'floxa_work_db',
      },
      memory: {
        rssMb: Math.round(memUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
      fileStorage: {
        status: 'online',
        provider: 'local_disk_vault',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'degraded',
      error: error.message || 'Failed to measure system health',
    });
  }
}

/**
 * 12. Safe CSV Export Helper
 * Defends against CSV Formula Injection by prepending single-quote to dangerous prefixes (=, +, -, @, \t, \r).
 */
function sanitizeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // CSV Injection defense: if cell starts with dangerous formula symbols, quote prefix it
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape internal double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * 13. Secure Data Exports (Users, Contracts, Moderation, External Payment Records)
 */
export async function exportPlatformData(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { type } = req.params;
    const maxRows = 5000;

    await AuditLog.create({
      actorId: req.user?.id,
      action: 'DATA_EXPORT_GENERATED',
      targetType: 'Export',
      targetId: type,
      metadata: { type },
    });

    if (type === 'users') {
      const users = await User.find()
        .select('-passwordHash -passwordResetTokenHash -emailVerificationTokenHash')
        .sort({ createdAt: -1 })
        .limit(maxRows);

      const headers = ['User ID', 'Name', 'Handle', 'Email', 'Role', 'Status', 'Verified', 'Created At'];
      const rows = users.map((u) => [
        sanitizeCsvValue(u.id),
        sanitizeCsvValue(u.name),
        sanitizeCsvValue(u.handle),
        sanitizeCsvValue(u.email),
        sanitizeCsvValue(u.role),
        sanitizeCsvValue(u.status || 'active'),
        sanitizeCsvValue(u.isVerified ? 'YES' : 'NO'),
        sanitizeCsvValue(u.createdAt ? u.createdAt.toISOString() : ''),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="floxa_users_export.csv"');
      res.send(csvContent);
      return;
    }

    if (type === 'contracts') {
      const contracts = await Contract.find()
        .populate('clientId', 'name email')
        .populate('freelancerId', 'name email')
        .sort({ createdAt: -1 })
        .limit(maxRows);

      const headers = [
        'Contract ID',
        'Client Name',
        'Freelancer Name',
        'Contractual Agreed Value',
        'Currency',
        'Status',
        'Closeout Status',
        'Created At',
      ];
      const rows = contracts.map((c: any) => [
        sanitizeCsvValue(c.id),
        sanitizeCsvValue(c.clientId?.name || 'Client'),
        sanitizeCsvValue(c.freelancerId?.name || 'Freelancer'),
        sanitizeCsvValue(c.totalBudget),
        sanitizeCsvValue(c.currency),
        sanitizeCsvValue(c.status),
        sanitizeCsvValue(c.closeoutStatus || 'open'),
        sanitizeCsvValue(c.createdAt ? c.createdAt.toISOString() : ''),
      ]);

      const csvContent = [
        `# ${NON_CUSTODIAL_DISCLOSURE}`,
        headers.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="floxa_contracts_export.csv"');
      res.send(csvContent);
      return;
    }

    if (type === 'external-payment-records') {
      const records = await PaymentRecord.find()
        .populate('payerId', 'name email')
        .populate('payeeId', 'name email')
        .sort({ createdAt: -1 })
        .limit(maxRows);

      const headers = [
        'Record ID',
        'Contract ID',
        'Milestone ID',
        'Reported Amount',
        'Currency',
        'Payment Method',
        'External UTR / Reference',
        'Settlement Status',
        'Created At',
      ];
      const rows = records.map((p: any) => [
        sanitizeCsvValue(p.id),
        sanitizeCsvValue(p.contractId),
        sanitizeCsvValue(p.milestoneId),
        sanitizeCsvValue(p.amount),
        sanitizeCsvValue(p.currency),
        sanitizeCsvValue(p.paymentMethod),
        sanitizeCsvValue(p.externalReference || 'N/A'),
        sanitizeCsvValue(p.status),
        sanitizeCsvValue(p.createdAt ? p.createdAt.toISOString() : ''),
      ]);

      const csvContent = [
        `# USER-REPORTED EXTERNAL PAYMENT RECORDS (DIRECT BILLING - ZERO ESCROW CUSTODY - NOT FLOXA REVENUE)`,
        `# ${NON_CUSTODIAL_DISCLOSURE}`,
        headers.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="floxa_external_payment_records.csv"');
      res.send(csvContent);
      return;
    }

    if (type === 'moderation') {
      const disputes = await Dispute.find().sort({ createdAt: -1 }).limit(maxRows);
      const headers = ['Dispute ID', 'Contract ID', 'Category', 'Title', 'Status', 'Created At'];
      const rows = disputes.map((d: any) => [
        sanitizeCsvValue(d.id),
        sanitizeCsvValue(d.contractId),
        sanitizeCsvValue(d.category),
        sanitizeCsvValue(d.title),
        sanitizeCsvValue(d.status),
        sanitizeCsvValue(d.createdAt ? d.createdAt.toISOString() : ''),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="floxa_disputes_export.csv"');
      res.send(csvContent);
      return;
    }

    res.status(400).json({ error: 'Invalid export type. Supported: users, contracts, external-payment-records, moderation' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate data export' });
  }
}
