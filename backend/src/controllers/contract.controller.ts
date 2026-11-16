import { Response } from 'express';
import mongoose from 'mongoose';
import { Contract } from '../models/Contract.model.js';
import { Milestone } from '../models/Milestone.model.js';
import { Proposal } from '../models/Proposal.model.js';
import { Brief } from '../models/Brief.model.js';
import { TalentProfile } from '../models/TalentProfile.model.js';
import { PaymentRecord } from '../models/PaymentRecord.model.js';
import { AuditLog } from '../models/AuditLog.model.js';
import { ContractActivity } from '../models/ContractActivity.model.js';
import { Notification } from '../models/Notification.model.js';
import { User } from '../models/User.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { broadcastSystemNotification } from '../websocket/socketServer.js';
import { generateInvoicePdfBuffer } from '../services/invoice/invoice.service.js';

export async function acceptProposalAndCreateContract(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { proposalId, clientSignature, paymentMethod } = req.body;
    if (!proposalId || !mongoose.Types.ObjectId.isValid(proposalId)) {
      res.status(400).json({ error: 'Valid proposalId is required' });
      return;
    }

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      res.status(404).json({ error: 'Target proposal not found' });
      return;
    }

    const brief = await Brief.findById(proposal.briefId);
    if (!brief) {
      res.status(404).json({ error: 'Associated brief not found' });
      return;
    }

    // STRICT BRIEF OWNERSHIP: Only the client who posted the brief can accept proposals!
    if (brief.clientId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: You can only accept proposals submitted to your own discovery briefs.' });
      return;
    }

    // Guard against already accepted proposals
    if (proposal.status === 'accepted') {
      res.status(409).json({ error: 'This proposal has already been accepted into an active project agreement.' });
      return;
    }

    // Guard against duplicate contracts for the same brief
    const existingContract = await Contract.findOne({
      $or: [{ proposalId: proposal._id }, { briefId: brief._id, status: { $in: ['active', 'completed'] } }],
    });
    if (existingContract) {
      res.status(409).json({ error: 'An active project contract has already been established for this discovery brief.' });
      return;
    }

    const contract = await Contract.create({
      briefId: brief._id,
      proposalId: proposal._id,
      clientId: req.user.id,
      freelancerId: proposal.freelancerId,
      totalBudget: proposal.totalPrice,
      currency: brief.currency || 'USD',
      status: 'active',
      msaAgreementSignedAt: new Date(),
      clientSignature: clientSignature || 'Digital E-Signature verified',
      proposalSnapshot: proposal.toObject(), // Immutable proposal terms snapshot
    });

    const milestonesData = proposal.proposedMilestones.map((m, index) => ({
      contractId: contract._id,
      milestoneNumber: index + 1,
      title: m.title,
      description: m.description,
      amount: m.amount,
      currency: brief.currency || 'USD',
      deliverableStatus: index === 0 ? 'approved' : 'in_progress',
      paymentStatus: index === 0 ? 'reported_by_client' : 'not_recorded',
      escrowState: index === 0 ? 'released' : 'awaiting_deposit',
      approvedAt: index === 0 ? new Date() : undefined,
    }));

    const createdMilestones = await Milestone.insertMany(milestonesData);

    // Initial 40% Advance Payment record
    const advanceMilestone = createdMilestones[0];
    await PaymentRecord.create({
      contractId: contract._id,
      milestoneId: advanceMilestone._id,
      payerId: contract.clientId,
      payeeId: contract.freelancerId,
      amount: advanceMilestone.amount,
      currency: contract.currency || 'USD',
      paymentMethod: paymentMethod || 'bank_transfer',
      paymentMethodDetails: 'Milestone 1 Advance direct arrangement',
      reportedDate: new Date(),
      status: 'reported_by_client',
      notes: 'Initial 40% Advance payment agreed upon signing project contract.',
    });

    proposal.status = 'accepted';
    proposal.acceptedAt = new Date();
    await proposal.save();

    // Decline competing pending/shortlisted proposals on this brief
    await Proposal.updateMany(
      { briefId: brief._id, _id: { $ne: proposal._id }, status: { $in: ['pending', 'shortlisted'] } },
      { status: 'declined', declinedAt: new Date(), clientFeedback: 'Another proposal was accepted for this brief.' }
    );

    brief.status = 'assigned';
    await brief.save();

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await AuditLog.create({
      actorId: req.user.id,
      action: 'PROPOSAL_ACCEPTED',
      targetType: 'Proposal',
      targetId: proposal.id,
      ipAddress,
      userAgent,
      metadata: { briefId: brief.id, contractId: contract.id, totalPrice: proposal.totalPrice },
    });

    await AuditLog.create({
      actorId: req.user.id,
      action: 'CONTRACT_CREATED',
      targetType: 'Contract',
      targetId: contract.id,
      ipAddress,
      userAgent,
      metadata: { briefId: brief.id, proposalId: proposal.id, milestoneCount: createdMilestones.length },
    });

    broadcastSystemNotification({
      title: 'Project Contract Initialized',
      message: `${req.user.name || 'Client'} accepted proposal for "${brief.title}" and recorded Milestone 1 Advance ($${advanceMilestone.amount.toLocaleString()}) via direct payment.`,
      senderName: req.user.name || 'Client',
      type: 'milestone',
      tab: 'workspace',
    });

    res.status(201).json({
      contract,
      milestones: createdMilestones,
      message: 'Project agreement initialized. Direct milestone payments are arranged between client and talent.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create contract' });
  }
}

export async function submitMilestoneDeliverable(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { milestoneId } = req.params;
    if (!milestoneId || !mongoose.Types.ObjectId.isValid(milestoneId)) {
      res.status(400).json({ error: 'Valid milestoneId is required' });
      return;
    }

    const { fileUrls, notes } = req.body;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    const contract = await Contract.findById(milestone.contractId);
    if (!contract) {
      res.status(404).json({ error: 'Associated contract not found' });
      return;
    }

    // STRICT AUTHORIZATION: Only the assigned freelancer can submit deliverables
    if (contract.freelancerId.toString() !== req.user.id.toString()) {
      res.status(403).json({ error: 'Only the assigned freelancer can submit milestone deliverables.' });
      return;
    }

    const nextVersion = (milestone.submissions?.length || 0) + 1;
    const submissionTitle = req.body.title || `Deliverable Submission v${nextVersion}`;

    milestone.submissions.push({
      version: nextVersion,
      title: submissionTitle,
      fileUrls: fileUrls && fileUrls.length > 0 ? fileUrls : ['Deliverable_Handover_Bundle.zip'],
      notes: notes || 'Deliverable source assets and vector package uploaded for client review.',
      submittedBy: req.user.id,
      submittedAt: new Date(),
      reviewStatus: 'pending',
    });

    milestone.deliverableStatus = 'in_review';
    milestone.escrowState = 'in_review';
    milestone.reviewDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await milestone.save();

    await ContractActivity.create({
      contractId: contract._id,
      actorId: req.user.id,
      action: 'DELIVERABLE_SUBMITTED',
      title: `Deliverable Submitted: Milestone ${milestone.milestoneNumber} (v${nextVersion})`,
      details: `${req.user.name || 'Freelancer'} submitted deliverable package v${nextVersion} for review.`,
      metadata: { milestoneId: milestone._id, version: nextVersion },
    });

    await Notification.create({
      userId: contract.clientId,
      senderId: req.user.id,
      contractId: contract._id,
      type: 'deliverable',
      title: `Deliverable Submitted: Milestone ${milestone.milestoneNumber}`,
      message: `${req.user.name || 'Freelancer'} uploaded deliverable v${nextVersion} for your review.`,
      linkUrl: `/workspace?contractId=${contract._id}&milestone=${milestone.milestoneNumber}`,
    });

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await AuditLog.create({
      actorId: req.user.id,
      action: 'DELIVERABLE_SUBMITTED',
      targetType: 'Milestone',
      targetId: milestone.id,
      ipAddress,
      userAgent,
      metadata: { contractId: contract.id, milestoneNumber: milestone.milestoneNumber },
    });

    broadcastSystemNotification({
      title: 'Deliverable Submitted',
      message: `${req.user.name || 'Freelancer'} submitted deliverable for Milestone ${milestone.milestoneNumber}!`,
      senderName: req.user.name || 'Freelancer',
      type: 'milestone',
      tab: 'workspace',
    });

    res.json({ message: 'Deliverable submitted for client review', milestone });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit deliverable' });
  }
}

export async function approveMilestoneDeliverable(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { milestoneId } = req.params;
    if (!milestoneId || !mongoose.Types.ObjectId.isValid(milestoneId)) {
      res.status(400).json({ error: 'Valid milestoneId is required' });
      return;
    }

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    const contract = await Contract.findById(milestone.contractId);
    if (!contract) {
      res.status(404).json({ error: 'Associated contract not found' });
      return;
    }

    // STRICT AUTHORIZATION: Only the contract client or platform admin can approve deliverables
    if (contract.clientId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Only the contract client can approve milestone deliverables.' });
      return;
    }

    // Milestone deliverable approval changes deliverableStatus to approved.
    // It does NOT release or custody money.
    milestone.deliverableStatus = 'approved';
    milestone.escrowState = 'released'; // backwards compatibility
    milestone.approvedAt = new Date();
    milestone.approvedBy = req.user.id;

    if (milestone.submissions && milestone.submissions.length > 0) {
      const lastSub = milestone.submissions[milestone.submissions.length - 1];
      lastSub.reviewStatus = 'approved';
      lastSub.reviewedBy = req.user.id;
      lastSub.reviewedAt = new Date();
    }
    await milestone.save();

    // Check if all milestones are approved
    const allMilestones = await Milestone.find({ contractId: milestone.contractId });
    const allApproved = allMilestones.every(
      (m) => m.deliverableStatus === 'approved' || m.escrowState === 'released'
    );
    if (allApproved) {
      await Contract.findByIdAndUpdate(milestone.contractId, { status: 'completed' });
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await AuditLog.create({
      actorId: req.user.id,
      action: 'DELIVERABLE_APPROVED',
      targetType: 'Milestone',
      targetId: milestone.id,
      ipAddress,
      userAgent,
      metadata: { contractId: contract.id, milestoneNumber: milestone.milestoneNumber, allApproved },
    });

    await ContractActivity.create({
      contractId: contract._id,
      actorId: req.user.id,
      action: 'DELIVERABLE_APPROVED',
      title: `Deliverable Approved: Milestone ${milestone.milestoneNumber}`,
      details: `${req.user.name || 'Client'} approved Milestone ${milestone.milestoneNumber} deliverable.`,
      metadata: { milestoneId: milestone._id, amount: milestone.amount },
    });

    await Notification.create({
      userId: contract.freelancerId,
      senderId: req.user.id,
      contractId: contract._id,
      type: 'deliverable',
      title: `Milestone ${milestone.milestoneNumber} Deliverable Approved!`,
      message: `${req.user.name || 'Client'} approved your milestone deliverable. Direct external payment can now be settled.`,
      linkUrl: `/workspace?contractId=${contract._id}&milestone=${milestone.milestoneNumber}`,
    });

    broadcastSystemNotification({
      title: 'Deliverable Approved',
      message: `${req.user.name || 'Client'} approved Milestone ${milestone.milestoneNumber} ($${milestone.amount.toLocaleString()}) deliverable! Direct payment can now be settled.`,
      senderName: req.user.name || 'Client',
      type: 'milestone',
      tab: 'workspace',
    });

    res.json({
      message: 'Deliverable approved successfully. Client and freelancer can now settle and record direct payment (0% platform custody).',
      milestone,
      allMilestonesApproved: allApproved,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to approve deliverable' });
  }
}

// Backwards-compatible alias for existing frontend callers
export const approveMilestoneAndReleaseEscrow = approveMilestoneDeliverable;

export async function requestMilestoneRevision(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { milestoneId } = req.params;
    const { feedback } = req.body;

    if (!feedback || !feedback.trim()) {
      res.status(400).json({ error: 'Clear revision feedback explanation is required.' });
      return;
    }

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    const contract = await Contract.findById(milestone.contractId);
    if (!contract) {
      res.status(404).json({ error: 'Associated contract not found' });
      return;
    }

    // STRICT AUTHORIZATION: Only the contract client (or admin) can request revisions
    if (contract.clientId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Only the project client can request milestone revisions.' });
      return;
    }

    const currentVersion = milestone.submissions?.length || 1;
    if (milestone.submissions && milestone.submissions.length > 0) {
      const lastSub = milestone.submissions[milestone.submissions.length - 1];
      lastSub.reviewStatus = 'revision_requested';
      lastSub.reviewFeedback = feedback.trim();
      lastSub.reviewedBy = req.user.id;
      lastSub.reviewedAt = new Date();
    }

    milestone.revisionRequests.push({
      feedback: feedback.trim(),
      requestedBy: req.user.id,
      requestedAt: new Date(),
      submissionVersion: currentVersion,
    });

    milestone.deliverableStatus = 'revision_requested';
    await milestone.save();

    await ContractActivity.create({
      contractId: contract._id,
      actorId: req.user.id,
      action: 'REVISION_REQUESTED',
      title: `Revision Requested: Milestone ${milestone.milestoneNumber}`,
      details: `${req.user.name || 'Client'} requested changes: "${feedback.trim().slice(0, 80)}..."`,
      metadata: { milestoneId: milestone._id, version: currentVersion },
    });

    await Notification.create({
      userId: contract.freelancerId,
      senderId: req.user.id,
      contractId: contract._id,
      type: 'revision',
      title: `Revision Requested: Milestone ${milestone.milestoneNumber}`,
      message: `${req.user.name || 'Client'} requested revisions with specific feedback.`,
      linkUrl: `/workspace?contractId=${contract._id}&milestone=${milestone.milestoneNumber}`,
    });

    broadcastSystemNotification({
      title: 'Revision Requested',
      message: `${req.user.name || 'Client'} requested changes for Milestone ${milestone.milestoneNumber}.`,
      senderName: req.user.name || 'Client',
      type: 'revision',
      tab: 'workspace',
    });

    res.json({ message: 'Revision requested with feedback recorded', milestone });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to request revision' });
  }
}

export async function getMilestoneSubmissions(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { milestoneId } = req.params;
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    const contract = await Contract.findById(milestone.contractId);
    if (!contract) {
      res.status(404).json({ error: 'Associated contract not found' });
      return;
    }

    const isClient = contract.clientId.toString() === req.user.id.toString();
    const isFreelancer = contract.freelancerId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isClient && !isFreelancer && !isAdmin) {
      res.status(403).json({ error: 'Access denied: You do not participate in this project contract.' });
      return;
    }

    res.json({
      submissions: milestone.submissions || [],
      revisionRequests: milestone.revisionRequests || [],
      milestoneId: milestone._id,
      deliverableStatus: milestone.deliverableStatus,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch milestone submissions' });
  }
}

export async function reportMilestonePayment(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { milestoneId } = req.params;
    const { paymentMethod, paymentMethodDetails, externalReference, receiptFileUrl, notes } = req.body;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    const contract = await Contract.findById(milestone.contractId);
    if (!contract) {
      res.status(404).json({ error: 'Associated contract not found' });
      return;
    }

    // STRICT AUTHORIZATION: Only the contract client can record payment reports
    if (contract.clientId.toString() !== req.user.id.toString()) {
      res.status(403).json({ error: 'Only the project client can report direct payment for this milestone.' });
      return;
    }

    if (milestone.paymentStatus === 'acknowledged_by_freelancer') {
      res.status(400).json({ error: 'Payment for this milestone has already been confirmed and acknowledged.' });
      return;
    }

    // Record user-reported direct payment
    const paymentRecord = await PaymentRecord.create({
      contractId: contract._id,
      milestoneId: milestone._id,
      payerId: contract.clientId,
      payeeId: contract.freelancerId,
      amount: milestone.amount,
      currency: milestone.currency || 'USD',
      paymentMethod: paymentMethod || 'bank_transfer',
      paymentMethodDetails: paymentMethodDetails || '',
      reportedDate: new Date(),
      externalReference: externalReference || '',
      receiptFileUrl: receiptFileUrl || '',
      status: 'reported_by_client',
      notes: notes || 'Direct payment reported by client.',
    });

    milestone.paymentStatus = 'reported_by_client';
    milestone.paymentReportedAt = new Date();
    milestone.paymentDetails = {
      paymentMethod: paymentMethod || 'bank_transfer',
      reportedAt: new Date(),
      externalReference: externalReference || '',
      receiptFileUrl: receiptFileUrl || '',
    };
    await milestone.save();

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await AuditLog.create({
      actorId: req.user.id,
      action: 'PAYMENT_REPORTED',
      targetType: 'PaymentRecord',
      targetId: paymentRecord.id,
      ipAddress,
      userAgent,
      metadata: {
        contractId: contract.id,
        milestoneId: milestone.id,
        amount: milestone.amount,
        paymentMethod: paymentMethod || 'bank_transfer',
        externalReference: externalReference || '',
      },
    });

    broadcastSystemNotification({
      title: 'Direct Payment Reported',
      message: `${req.user.name || 'Client'} reported direct payment of $${milestone.amount.toLocaleString()} for Milestone ${milestone.milestoneNumber}. Pending talent confirmation.`,
      senderName: req.user.name || 'Client',
      type: 'milestone',
      tab: 'workspace',
    });

    res.status(201).json({
      message: 'Direct payment record submitted. Talent can now acknowledge receipt.',
      paymentRecord,
      milestone,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record direct payment' });
  }
}

export async function acknowledgeMilestonePayment(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { milestoneId } = req.params;
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    const contract = await Contract.findById(milestone.contractId);
    if (!contract) {
      res.status(404).json({ error: 'Associated contract not found' });
      return;
    }

    // STRICT AUTHORIZATION: Only the designated freelancer can acknowledge receipt
    if (contract.freelancerId.toString() !== req.user.id.toString()) {
      res.status(403).json({ error: 'Only the project freelancer can acknowledge receipt of direct payment.' });
      return;
    }

    // Guard: Client must report payment before freelancer can acknowledge it
    if (milestone.paymentStatus !== 'reported_by_client') {
      res.status(400).json({ error: 'Direct payment must be reported by the client before receipt can be acknowledged.' });
      return;
    }

    // Update payment records
    await PaymentRecord.updateMany(
      { milestoneId: milestone._id, status: 'reported_by_client' },
      { status: 'acknowledged_by_freelancer', acknowledgedAt: new Date() }
    );

    milestone.paymentStatus = 'acknowledged_by_freelancer';
    milestone.paymentAcknowledgedAt = new Date();
    if (milestone.paymentDetails) {
      milestone.paymentDetails.acknowledgedAt = new Date();
    }
    await milestone.save();

    // Increment acknowledged volume in talent profile
    await TalentProfile.findOneAndUpdate(
      { userId: contract.freelancerId },
      { $inc: { escrowVolumeEarned: milestone.amount } }
    );

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await AuditLog.create({
      actorId: req.user.id,
      action: 'PAYMENT_ACKNOWLEDGED',
      targetType: 'Milestone',
      targetId: milestone.id,
      ipAddress,
      userAgent,
      metadata: { contractId: contract.id, milestoneNumber: milestone.milestoneNumber, amount: milestone.amount },
    });

    broadcastSystemNotification({
      title: 'Payment Acknowledged',
      message: `${req.user.name || 'Freelancer'} confirmed receipt of direct payment for Milestone ${milestone.milestoneNumber} ($${milestone.amount.toLocaleString()})!`,
      senderName: req.user.name || 'Freelancer',
      type: 'milestone',
      tab: 'workspace',
    });

    res.json({
      message: 'Direct payment receipt confirmed by freelancer.',
      milestone,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to acknowledge payment' });
  }
}

export async function disputeMilestonePayment(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { milestoneId } = req.params;
    const { reason } = req.body;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    const contract = await Contract.findById(milestone.contractId);
    if (!contract) {
      res.status(404).json({ error: 'Associated contract not found' });
      return;
    }

    // STRICT AUTHORIZATION: Only the contract client, freelancer, or admin can dispute
    const isParticipant =
      contract.clientId.toString() === req.user.id.toString() ||
      contract.freelancerId.toString() === req.user.id.toString() ||
      req.user.role === 'admin';

    if (!isParticipant) {
      res.status(403).json({ error: 'You do not have permission to dispute payments for this contract.' });
      return;
    }

    milestone.paymentStatus = 'disputed';
    if (milestone.paymentDetails) {
      milestone.paymentDetails.disputeReason = reason || 'Discrepancy in direct payment receipt.';
    }
    await milestone.save();

    await PaymentRecord.updateMany(
      { milestoneId: milestone._id },
      { status: 'disputed', disputeReason: reason || 'Discrepancy reported.' }
    );

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await AuditLog.create({
      actorId: req.user.id,
      action: 'PAYMENT_DISPUTED',
      targetType: 'Milestone',
      targetId: milestone.id,
      ipAddress,
      userAgent,
      metadata: { contractId: contract.id, milestoneNumber: milestone.milestoneNumber, reason },
    });

    res.json({ message: 'Payment record marked as disputed. Admin team notified.', milestone });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to dispute payment record' });
  }
}

export async function getActiveContract(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const contract = await Contract.findOne({
      $or: [{ clientId: req.user.id }, { freelancerId: req.user.id }],
      status: 'active',
    })
      .populate('briefId', 'title category budgetMin budgetMax deliverablesRequired')
      .populate('clientId', 'name handle email avatarUrl isVerified')
      .populate('freelancerId', 'name handle email avatarUrl isVerified')
      .sort({ createdAt: -1 });

    if (!contract) {
      res.json({ contract: null, milestones: [], paymentRecords: [] });
      return;
    }

    const milestones = await Milestone.find({ contractId: contract._id }).sort({ milestoneNumber: 1 });
    const paymentRecords = await PaymentRecord.find({ contractId: contract._id }).sort({ createdAt: -1 });

    res.json({ contract, milestones, paymentRecords });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch active contract' });
  }
}

export async function getMyContracts(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const contracts = await Contract.find({
      $or: [{ clientId: req.user.id }, { freelancerId: req.user.id }],
    })
      .populate('briefId', 'title category budgetMin budgetMax')
      .populate('clientId', 'name handle avatarUrl isVerified')
      .populate('freelancerId', 'name handle avatarUrl isVerified')
      .sort({ createdAt: -1 });

    res.json({ contracts });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch contracts' });
  }
}

export async function getContractDetails(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { contractId } = req.params;
    const contract = await Contract.findById(contractId)
      .populate('briefId')
      .populate('clientId', 'name handle avatarUrl')
      .populate('freelancerId', 'name handle avatarUrl');

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    const milestones = await Milestone.find({ contractId: contract._id }).sort({ milestoneNumber: 1 });
    const paymentRecords = await PaymentRecord.find({ contractId: contract._id }).sort({ createdAt: -1 });

    res.json({ contract, milestones, paymentRecords });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch contract details' });
  }
}

export async function downloadMilestoneInvoice(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { contractId, milestoneId } = req.params;
    if (!contractId || !mongoose.Types.ObjectId.isValid(contractId)) {
      res.status(400).json({ error: 'Valid contractId is required' });
      return;
    }

    const contract = await Contract.findById(contractId)
      .populate('briefId', 'title')
      .populate('clientId', 'name email handle')
      .populate('freelancerId', 'name email handle');

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    const client: any = contract.clientId;
    const freelancer: any = contract.freelancerId;
    const brief: any = contract.briefId;

    const isClient = client?._id?.toString() === req.user.id.toString();
    const isFreelancer = freelancer?._id?.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin' || (req.user as any).adminRole;

    if (!isClient && !isFreelancer && !isAdmin) {
      res.status(403).json({ error: 'Forbidden: You cannot download an invoice for this contract.' });
      return;
    }

    let milestone: any = null;
    if (milestoneId) {
      if (mongoose.Types.ObjectId.isValid(milestoneId)) {
        milestone = await Milestone.findById(milestoneId);
      } else if (!isNaN(Number(milestoneId))) {
        milestone = await Milestone.findOne({ contractId: contract._id, milestoneNumber: Number(milestoneId) });
      }
    }

    if (!milestone) {
      milestone = await Milestone.findOne({ contractId: contract._id }).sort({ milestoneNumber: 1 });
    }

    const mNumber = milestone ? milestone.milestoneNumber : 1;
    const invoiceNumber = `INV-${contract._id.toString().slice(-6).toUpperCase()}-M${mNumber}`;
    const issueDate = milestone?.approvedAt || milestone?.updatedAt || contract.createdAt || new Date();
    const amount = milestone ? milestone.amount : contract.totalBudget;

    const deliverables = milestone?.deliverables && milestone.deliverables.length > 0
      ? milestone.deliverables.map((d: any) => typeof d === 'string' ? d : d.title || d.description)
      : [milestone?.title || 'Scope Deliverable Acceptance'];

    const pdfBuffer = await generateInvoicePdfBuffer({
      invoiceNumber,
      issueDate,
      contractTitle: brief?.title || 'Professional Freelance Agreement',
      contractId: contract._id.toString(),
      milestoneTitle: milestone?.title || `Milestone ${mNumber} Settlement`,
      milestoneIndex: mNumber,
      clientName: client?.name || 'Verified Client',
      clientEmail: client?.email || 'client@floxa.work',
      freelancerName: freelancer?.name || 'Verified Specialist',
      freelancerEmail: freelancer?.email || 'freelancer@floxa.work',
      amount,
      currency: contract.currency || 'USD',
      deliverables,
      status: milestone?.escrowState === 'released' || milestone?.paymentStatus === 'acknowledged_by_freelancer'
        ? 'Settled & Verified'
        : 'Milestone Executed'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Invoice error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate tax invoice' });
  }
}

export async function orderInstantPackage(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'client' && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Only clients can order service packages' });
      return;
    }

    const { freelancerId, packageTitle, price, deliveryDays, deliverables, briefNote } = req.body;
    if (!freelancerId || !packageTitle || !price) {
      res.status(400).json({ error: 'freelancerId, packageTitle, and price are required' });
      return;
    }

    const freelancer = await User.findById(freelancerId);
    if (!freelancer) {
      res.status(404).json({ error: 'Freelancer not found' });
      return;
    }

    const brief = await Brief.create({
      clientId: req.user.id,
      title: packageTitle,
      category: 'branding',
      problemStatement: briefNote || `Instant package order for ${packageTitle}. Agreed delivery in ${deliveryDays || 5} days.`,
      targetAudience: 'Global / Multi-channel',
      deliverablesRequired: Array.isArray(deliverables) && deliverables.length > 0 ? deliverables : [packageTitle],
      budgetMin: Number(price),
      budgetMax: Number(price),
      currency: 'USD',
      deadlineWeeks: Math.max(1, Math.ceil((Number(deliveryDays) || 7) / 7)),
      status: 'assigned',
      sliders: [],
      proposalsCount: 1,
      magicLinkToken: `pkg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    });

    const contract: any = await Contract.create({
      briefId: brief._id,
      clientId: req.user.id,
      freelancerId: (freelancer as any)._id,
      totalBudget: Number(price),
      currency: 'USD',
      status: 'active',
      msaAgreementSignedAt: new Date(),
      clientSignature: `Instant Order by ${req.user.name || 'Client'} (${req.user.email || 'client@floxa.work'})`,
      proposalSnapshot: {
        packageTitle,
        deliverables,
        deliveryDays,
        orderedAt: new Date(),
      },
    });

    const milestone: any = await Milestone.create({
      contractId: contract._id,
      milestoneNumber: 1,
      title: `${packageTitle} — Complete Delivery`,
      description: `Delivery within ${deliveryDays || 5} business days. Deliverables: ${(deliverables || []).join(', ')}`,
      amount: Number(price),
      currency: 'USD',
      deliverableStatus: 'in_progress',
      paymentStatus: 'not_recorded',
      escrowState: 'awaiting_deposit',
      deliverableRequirements: Array.isArray(deliverables) && deliverables.length > 0 ? deliverables : [packageTitle],
      submissions: [],
      revisionRequests: [],
    });

    await PaymentRecord.create({
      contractId: contract._id,
      milestoneId: milestone._id,
      payerId: contract.clientId,
      payeeId: contract.freelancerId,
      amount: milestone.amount,
      currency: 'USD',
      paymentMethod: 'bank_transfer',
      paymentMethodDetails: 'Fixed-Scope Package Order',
      reportedDate: new Date(),
      status: 'not_recorded',
      notes: `Instant package hire: ${packageTitle}`,
    });

    await Notification.create({
      userId: (freelancer as any)._id,
      type: 'milestone',
      title: 'New Instant Package Order Received!',
      message: `${req.user.name || 'A client'} just ordered "${packageTitle}" for $${Number(price).toLocaleString()}!`,
      linkUrl: '/active-contract',
      read: false,
    });

    broadcastSystemNotification({
      type: 'milestone',
      title: 'New Instant Package Order Received!',
      message: `${req.user.name || 'A client'} ordered "${packageTitle}" ($${Number(price).toLocaleString()})`,
    });

    res.status(201).json({
      message: 'Instant package order placed successfully',
      contract,
      milestone,
      brief,
    });
  } catch (error: any) {
    console.error('Instant package error:', error);
    res.status(500).json({ error: error.message || 'Failed to order instant package' });
  }
}
