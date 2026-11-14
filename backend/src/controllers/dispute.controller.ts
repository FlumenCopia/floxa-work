import { Response } from 'express';
import mongoose from 'mongoose';
import { Dispute, IDispute, DisputeCategory, DisputeStatus } from '../models/Dispute.model.js';
import { DisputeMessage } from '../models/DisputeMessage.model.js';
import { Contract } from '../models/Contract.model.js';
import { ContractActivity } from '../models/ContractActivity.model.js';
import { Notification } from '../models/Notification.model.js';
import { AuditLog } from '../models/AuditLog.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { broadcastSystemNotification } from '../websocket/socketServer.js';

const VALID_CATEGORIES: DisputeCategory[] = [
  'deliverable_quality',
  'scope_disagreement',
  'missed_deadlines',
  'communication_conduct',
  'payment_disagreement',
  'commitment_breach',
  'other',
];

const NON_CUSTODIAL_NOTICE =
  'FLOXA Work is a direct settlement coordinator and does not hold user funds in escrow. Dispute resolution provides platform mediation, factual review, and conduct evaluation.';

/**
 * Open a dispute on a contract.
 */
export async function openContractDispute(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const { contractId: bodyContractId, category, title, description, desiredOutcome, evidenceFiles } =
      req.body;
    const contractId = req.params.contractId || bodyContractId;

    if (!contractId || !mongoose.Types.ObjectId.isValid(contractId)) {
      res.status(400).json({ error: 'Valid contract ID is required' });
      return;
    }

    const contract = await Contract.findById(contractId);
    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    const isClient = contract.clientId.toString() === req.user.id.toString();
    const isFreelancer = contract.freelancerId.toString() === req.user.id.toString();

    // Must be participant
    if (!isClient && !isFreelancer && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: You are not a participant of this contract' });
      return;
    }

    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({
        error: `Invalid dispute category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
      return;
    }

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Dispute title is required' });
      return;
    }

    if (!description || !description.trim()) {
      res.status(400).json({ error: 'Dispute description is required' });
      return;
    }

    const respondentId = isClient ? contract.freelancerId : contract.clientId;

    // Check if an open dispute already exists on this contract
    const existingOpenDispute = await Dispute.findOne({
      contractId: contract._id,
      status: { $in: ['open', 'awaiting_response', 'under_review', 'escalated'] },
    });
    if (existingOpenDispute) {
      res.status(409).json({
        error: 'An active dispute is already in progress for this contract',
        disputeId: existingOpenDispute.id,
      });
      return;
    }

    const dispute = await Dispute.create({
      contractId: contract._id,
      briefId: contract.briefId,
      initiatorId: req.user.id,
      respondentId,
      category,
      title: title.trim(),
      description: description.trim(),
      desiredOutcome: (desiredOutcome || '').trim(),
      status: 'open',
      evidenceFiles: Array.isArray(evidenceFiles) ? evidenceFiles : [],
    });

    // Update contract status to 'disputed' if currently active
    if (contract.status === 'active') {
      contract.status = 'disputed';
      await contract.save();
    }

    // Record activity & notifications
    await ContractActivity.create({
      contractId: contract._id,
      actorId: req.user.id,
      action: 'PAYMENT_DISPUTED',
      title: 'Dispute Initiated',
      details: `Dispute opened for: ${title.trim()} (${category})`,
      metadata: { disputeId: dispute.id, category },
    });

    await Notification.create({
      userId: respondentId,
      senderId: req.user.id,
      contractId: contract._id,
      type: 'info',
      title: 'Dispute Opened',
      message: `A dispute has been opened regarding: ${title.trim()}`,
      linkUrl: `/contracts/${contract._id}`,
    });

    broadcastSystemNotification({
      title: 'Dispute Opened',
      message: `A dispute was opened on contract ${contract.id}`,
      type: 'dispute_opened',
    });

    await AuditLog.create({
      actorId: req.user.id,
      action: 'dispute_opened',
      targetType: 'contract',
      targetId: contract._id?.toString(),
      metadata: { disputeId: dispute.id, category, title: title.trim() },
    });

    res.status(201).json({
      success: true,
      dispute,
      nonCustodialNotice: NON_CUSTODIAL_NOTICE,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to open dispute' });
  }
}

/**
 * Get dispute details with message thread.
 * STRICT SECURITY: Private moderator notes are filtered out for regular participants.
 */
export async function getDisputeDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const { disputeId } = req.params;
    if (!disputeId || !mongoose.Types.ObjectId.isValid(disputeId)) {
      res.status(400).json({ error: 'Valid dispute ID is required' });
      return;
    }

    const dispute = await Dispute.findById(disputeId)
      .populate('initiatorId', 'name handle email avatarUrl role')
      .populate('respondentId', 'name handle email avatarUrl role')
      .populate('assignedModeratorId', 'name handle email')
      .populate('contractId', 'briefId totalBudget currency status');

    if (!dispute) {
      res.status(404).json({ error: 'Dispute not found' });
      return;
    }

    const isInitiator =
      (dispute.initiatorId as any)._id?.toString() === req.user.id.toString() ||
      dispute.initiatorId.toString() === req.user.id.toString();
    const isRespondent =
      (dispute.respondentId as any)._id?.toString() === req.user.id.toString() ||
      dispute.respondentId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isInitiator && !isRespondent && !isAdmin) {
      res.status(403).json({ error: 'Forbidden: You are not authorized to view this dispute' });
      return;
    }

    // Message query: participants NEVER see internal moderator notes
    const messageFilter: Record<string, any> = { disputeId: dispute._id };
    if (!isAdmin) {
      messageFilter.isInternalModeratorNote = false;
    }

    const messages = await DisputeMessage.find(messageFilter)
      .populate('senderId', 'name handle avatarUrl role')
      .sort({ createdAt: 1 });

    res.json({
      dispute,
      messages,
      nonCustodialNotice: NON_CUSTODIAL_NOTICE,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get dispute details' });
  }
}

/**
 * Post a message to a dispute thread.
 */
export async function postDisputeMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const { disputeId } = req.params;
    const { text, attachments, isInternalModeratorNote } = req.body;

    if (!disputeId || !mongoose.Types.ObjectId.isValid(disputeId)) {
      res.status(400).json({ error: 'Valid dispute ID is required' });
      return;
    }

    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Message text is required' });
      return;
    }

    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      res.status(404).json({ error: 'Dispute not found' });
      return;
    }

    const isInitiator = dispute.initiatorId.toString() === req.user.id.toString();
    const isRespondent = dispute.respondentId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isInitiator && !isRespondent && !isAdmin) {
      res.status(403).json({ error: 'Forbidden: You cannot post in this dispute' });
      return;
    }

    // Only admins/moderators can create internal notes
    const internalNote = isAdmin && isInternalModeratorNote === true;

    let senderRole: 'initiator' | 'respondent' | 'moderator' | 'admin' = 'initiator';
    if (isAdmin) senderRole = 'moderator';
    else if (isRespondent) senderRole = 'respondent';

    const message = await DisputeMessage.create({
      disputeId: dispute._id,
      senderId: req.user.id,
      senderRole,
      text: text.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      isInternalModeratorNote: internalNote,
    });

    // Advance status from open -> awaiting_response or under_review
    if (!internalNote) {
      if (dispute.status === 'open' && isRespondent) {
        dispute.status = 'under_review';
        await dispute.save();
      }

      // Notify the other party
      const notifyUserId = isInitiator ? dispute.respondentId : dispute.initiatorId;
      await Notification.create({
        userId: notifyUserId,
        senderId: req.user.id,
        contractId: dispute.contractId,
        type: 'info',
        title: 'New Dispute Message',
        message: `${req.user.name || 'Participant'} posted a message in the dispute thread.`,
        linkUrl: `/contracts/${dispute.contractId}`,
      });

      broadcastSystemNotification({
        title: 'New Dispute Message',
        message: `${req.user.name || 'Participant'} posted a message in the dispute thread.`,
        type: 'dispute_message',
      });
    }

    const populated = await DisputeMessage.findById(message._id).populate(
      'senderId',
      'name handle avatarUrl role'
    );

    res.status(201).json({ success: true, message: populated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to post dispute message' });
  }
}

/**
 * Upload evidence to a dispute.
 */
export async function uploadDisputeEvidence(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const { disputeId } = req.params;
    const { fileUrl, fileName, fileSize } = req.body;

    if (!disputeId || !mongoose.Types.ObjectId.isValid(disputeId)) {
      res.status(400).json({ error: 'Valid dispute ID is required' });
      return;
    }

    if (!fileUrl || !fileName) {
      res.status(400).json({ error: 'fileUrl and fileName are required' });
      return;
    }

    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      res.status(404).json({ error: 'Dispute not found' });
      return;
    }

    const isInitiator = dispute.initiatorId.toString() === req.user.id.toString();
    const isRespondent = dispute.respondentId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isInitiator && !isRespondent && !isAdmin) {
      res.status(403).json({ error: 'Forbidden: You cannot upload evidence to this dispute' });
      return;
    }

    dispute.evidenceFiles.push({
      fileUrl,
      fileName,
      fileSize: fileSize || 0,
      uploadedBy: new mongoose.Types.ObjectId(req.user.id),
      uploadedAt: new Date(),
    });

    await dispute.save();

    res.json({ success: true, evidenceFiles: dispute.evidenceFiles });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to upload dispute evidence' });
  }
}

/**
 * Get all disputes on a contract.
 */
export async function getContractDisputes(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const { contractId } = req.params;
    if (!contractId || !mongoose.Types.ObjectId.isValid(contractId)) {
      res.status(400).json({ error: 'Valid contract ID is required' });
      return;
    }

    const contract = await Contract.findById(contractId);
    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    const isClient = contract.clientId.toString() === req.user.id.toString();
    const isFreelancer = contract.freelancerId.toString() === req.user.id.toString();

    if (!isClient && !isFreelancer && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: You are not a participant of this contract' });
      return;
    }

    const disputes = await Dispute.find({ contractId: contract._id })
      .populate('initiatorId', 'name handle avatarUrl')
      .populate('respondentId', 'name handle avatarUrl')
      .sort({ createdAt: -1 });

    res.json({ disputes, nonCustodialNotice: NON_CUSTODIAL_NOTICE });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get contract disputes' });
  }
}

/**
 * Admin / Moderator: Get all disputes.
 */
export async function getAdminDisputes(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    const status = req.query.status as string;
    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    const disputes = await Dispute.find(filter)
      .populate('initiatorId', 'name handle email avatarUrl')
      .populate('respondentId', 'name handle email avatarUrl')
      .populate('assignedModeratorId', 'name handle email')
      .populate('contractId', 'totalBudget currency status')
      .sort({ createdAt: -1 });

    res.json({ disputes });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get admin disputes' });
  }
}

/**
 * Update dispute status (moderator or initiator closing).
 */
export async function updateDisputeStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const { disputeId } = req.params;
    const { status, moderatorNotes } = req.body;

    if (!disputeId || !mongoose.Types.ObjectId.isValid(disputeId)) {
      res.status(400).json({ error: 'Valid dispute ID is required' });
      return;
    }

    const validStatuses: DisputeStatus[] = [
      'open',
      'awaiting_response',
      'under_review',
      'escalated',
      'resolved',
      'closed',
    ];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      res.status(404).json({ error: 'Dispute not found' });
      return;
    }

    const isInitiator = dispute.initiatorId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    // Non-admin can only close their own dispute
    if (!isAdmin && (!isInitiator || status !== 'closed')) {
      res.status(403).json({
        error: 'Forbidden: Only moderators can change dispute status to states other than closed',
      });
      return;
    }

    dispute.status = status;
    if (moderatorNotes) dispute.moderatorNotes = moderatorNotes;
    if (status === 'closed' || status === 'resolved') {
      dispute.resolvedAt = new Date();
      dispute.resolvedBy = new mongoose.Types.ObjectId(req.user.id);
    }

    await dispute.save();

    await AuditLog.create({
      actorId: req.user.id,
      action: `dispute_status_${status}`,
      targetType: 'dispute',
      targetId: dispute._id?.toString(),
      metadata: { status, moderatorNotes },
    });

    res.json({ success: true, dispute });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update dispute status' });
  }
}

/**
 * Resolve dispute with formal resolution summary and action.
 */
export async function resolveDispute(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin / Moderator access required' });
      return;
    }

    const { disputeId } = req.params;
    const { resolutionSummary, resolutionAction, contractStatusUpdate } = req.body;

    if (!disputeId || !mongoose.Types.ObjectId.isValid(disputeId)) {
      res.status(400).json({ error: 'Valid dispute ID is required' });
      return;
    }

    if (!resolutionSummary || !resolutionSummary.trim()) {
      res.status(400).json({ error: 'Resolution summary is required' });
      return;
    }

    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      res.status(404).json({ error: 'Dispute not found' });
      return;
    }

    dispute.status = 'resolved';
    dispute.resolutionSummary = resolutionSummary.trim();
    dispute.resolutionAction = resolutionAction || 'Platform mediated settlement reached';
    dispute.resolvedAt = new Date();
    dispute.resolvedBy = new mongoose.Types.ObjectId(req.user.id);

    await dispute.save();

    // Optionally update contract status if requested (e.g. from disputed -> active, completed, or cancelled)
    if (contractStatusUpdate && ['active', 'completed', 'cancelled'].includes(contractStatusUpdate)) {
      await Contract.findByIdAndUpdate(dispute.contractId, { status: contractStatusUpdate });
    }

    // Notify both parties
    await Notification.create({
      userId: dispute.initiatorId,
      senderId: req.user.id,
      contractId: dispute.contractId,
      type: 'info',
      title: 'Dispute Resolved',
      message: `The dispute regarding "${dispute.title}" has been resolved by platform moderation.`,
      linkUrl: `/contracts/${dispute.contractId}`,
    });

    await Notification.create({
      userId: dispute.respondentId,
      senderId: req.user.id,
      contractId: dispute.contractId,
      type: 'info',
      title: 'Dispute Resolved',
      message: `The dispute regarding "${dispute.title}" has been resolved by platform moderation.`,
      linkUrl: `/contracts/${dispute.contractId}`,
    });

    res.json({
      success: true,
      dispute,
      nonCustodialNotice: NON_CUSTODIAL_NOTICE,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to resolve dispute' });
  }
}
