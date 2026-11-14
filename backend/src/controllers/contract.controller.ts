import { Response } from 'express';
import mongoose from 'mongoose';
import { Contract } from '../models/Contract.model.js';
import { Milestone } from '../models/Milestone.model.js';
import { Proposal } from '../models/Proposal.model.js';
import { Brief } from '../models/Brief.model.js';
import { TalentProfile } from '../models/TalentProfile.model.js';
import { PaymentRecord } from '../models/PaymentRecord.model.js';
import { AuditLog } from '../models/AuditLog.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { broadcastSystemNotification } from '../websocket/socketServer.js';

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

    milestone.submissions.push({
      fileUrls: fileUrls && fileUrls.length > 0 ? fileUrls : ['Deliverable_Handover_Bundle.zip'],
      notes: notes || 'Deliverable source assets and vector package uploaded for client review.',
      submittedAt: new Date(),
    });

    milestone.deliverableStatus = 'in_review';
    milestone.escrowState = 'in_review';
    milestone.reviewDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await milestone.save();

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
