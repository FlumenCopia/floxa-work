import { Response } from 'express';
import mongoose from 'mongoose';
import { UserReport, ReportTargetType, ReportStatus } from '../models/UserReport.model.js';
import { UserBlock } from '../models/UserBlock.model.js';
import { User } from '../models/User.model.js';
import { AuditLog } from '../models/AuditLog.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/**
 * Submit a report for a user, review, contract, or message.
 */
export async function reportUserOrItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const { targetType, targetId, targetUserId, reason, details, evidenceUrls } = req.body;

    const validTargetTypes: ReportTargetType[] = ['user', 'review', 'contract', 'message', 'brief'];
    if (!validTargetTypes.includes(targetType)) {
      res.status(400).json({
        error: `Invalid targetType. Must be one of: ${validTargetTypes.join(', ')}`,
      });
      return;
    }

    if (!targetId || !targetId.toString().trim()) {
      res.status(400).json({ error: 'targetId is required' });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ error: 'Reason for report is required' });
      return;
    }

    const report = await UserReport.create({
      reporterId: req.user.id,
      targetType,
      targetId: targetId.toString().trim(),
      targetUserId: targetUserId && mongoose.Types.ObjectId.isValid(targetUserId) ? targetUserId : null,
      reason: reason.trim(),
      details: (details || '').trim(),
      evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
      status: 'pending',
    });

    await AuditLog.create({
      actorId: req.user.id,
      action: 'safety_report_submitted',
      targetType,
      targetId: targetId.toString(),
      metadata: { reportId: report.id, reason: reason.trim() },
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our safety team will review it.',
      report,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit report' });
  }
}

/**
 * Admin: Get reports queue.
 */
export async function getAdminReports(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    const status = req.query.status as string;
    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    const reports = await UserReport.find(filter)
      .populate('reporterId', 'name handle email avatarUrl')
      .populate('targetUserId', 'name handle email avatarUrl')
      .populate('resolvedBy', 'name handle email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ reports });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get reports' });
  }
}

/**
 * Admin: Resolve or update status of a report.
 */
export async function resolveAdminReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
      res.status(400).json({ error: 'Valid report ID is required' });
      return;
    }

    const validStatuses: ReportStatus[] = ['pending', 'investigating', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const report = await UserReport.findById(reportId);
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    report.status = status;
    if (adminNotes) report.adminNotes = adminNotes;
    if (status === 'resolved' || status === 'dismissed') {
      report.resolvedAt = new Date();
      report.resolvedBy = new mongoose.Types.ObjectId(req.user.id);
    }

    await report.save();

    await AuditLog.create({
      actorId: req.user.id,
      action: `safety_report_${status}`,
      targetType: 'user_report',
      targetId: report.id,
      metadata: { status, adminNotes },
    });

    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update report' });
  }
}

/**
 * Block another user.
 */
export async function blockUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const { targetUserId, reason } = req.body;
    const blockedId = req.params.userId || targetUserId;

    if (!blockedId || !mongoose.Types.ObjectId.isValid(blockedId)) {
      res.status(400).json({ error: 'Valid user ID to block is required' });
      return;
    }

    if (blockedId.toString() === req.user.id.toString()) {
      res.status(400).json({ error: 'You cannot block yourself' });
      return;
    }

    const targetUser = await User.findById(blockedId);
    if (!targetUser) {
      res.status(404).json({ error: 'Target user not found' });
      return;
    }

    const block = await UserBlock.findOneAndUpdate(
      { blockerId: req.user.id, blockedId: targetUser._id },
      { $set: { blockerId: req.user.id, blockedId: targetUser._id, reason: reason || '' } },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      actorId: req.user.id,
      action: 'user_blocked',
      targetType: 'user',
      targetId: targetUser.id,
      metadata: { reason: reason || '' },
    });

    res.status(201).json({
      success: true,
      message: `User ${targetUser.name} (@${targetUser.handle}) has been blocked.`,
      block,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to block user' });
  }
}

/**
 * Unblock a user.
 */
export async function unblockUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const { userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Valid user ID is required' });
      return;
    }

    const result = await UserBlock.findOneAndDelete({
      blockerId: req.user.id,
      blockedId: new mongoose.Types.ObjectId(userId),
    });

    if (!result) {
      res.status(404).json({ error: 'User is not in your blocked list' });
      return;
    }

    await AuditLog.create({
      actorId: req.user.id,
      action: 'user_unblocked',
      targetType: 'user',
      targetId: userId,
    });

    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to unblock user' });
  }
}

/**
 * Get list of users blocked by current user.
 */
export async function getBlockedUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const blocks = await UserBlock.find({ blockerId: req.user.id })
      .populate('blockedId', 'name handle avatarUrl role')
      .sort({ createdAt: -1 });

    res.json({ blocks });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get blocked users' });
  }
}

/**
 * Helper to check whether two users have an active block between them.
 */
export async function isBlockedBetween(
  userAId: string | mongoose.Types.ObjectId,
  userBId: string | mongoose.Types.ObjectId
): Promise<boolean> {
  const block = await UserBlock.findOne({
    $or: [
      { blockerId: userAId, blockedId: userBId },
      { blockerId: userBId, blockedId: userAId },
    ],
  });
  return !!block;
}
