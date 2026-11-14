import { Response } from 'express';
import mongoose from 'mongoose';
import { Contract } from '../models/Contract.model.js';
import { Milestone } from '../models/Milestone.model.js';
import { Proposal } from '../models/Proposal.model.js';
import { Brief } from '../models/Brief.model.js';
import { TalentProfile } from '../models/TalentProfile.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { broadcastSystemNotification } from '../websocket/socketServer.js';

export async function acceptProposalAndCreateContract(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { proposalId, clientSignature } = req.body;
    if (!proposalId || !mongoose.Types.ObjectId.isValid(proposalId)) {
      res.status(400).json({ error: 'Valid proposalId is required' });
      return;
    }

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    const brief = await Brief.findById(proposal.briefId);
    if (!brief) {
      res.status(404).json({ error: 'Associated brief not found' });
      return;
    }

    const contract = await Contract.create({
      briefId: brief._id,
      proposalId: proposal._id,
      clientId: req.user.id,
      freelancerId: proposal.freelancerId,
      totalBudget: proposal.totalPrice,
      currency: brief.currency,
      status: 'active',
      msaAgreementSignedAt: new Date(),
      clientSignature: clientSignature || 'Digital E-Signature verified',
    });

    const milestonesData = proposal.proposedMilestones.map((m, index) => ({
      contractId: contract._id,
      milestoneNumber: index + 1,
      title: m.title,
      description: m.description,
      amount: m.amount,
      escrowState: index === 0 ? 'released' : 'awaiting_deposit',
      paymentGatewayRef: index === 0 ? `DIRECT_PAY_ADVANCE_${Date.now()}` : '',
      approvedAt: index === 0 ? new Date() : undefined,
      releasedAt: index === 0 ? new Date() : undefined,
    }));

    const createdMilestones = await Milestone.insertMany(milestonesData);

    proposal.status = 'accepted';
    await proposal.save();

    brief.status = 'assigned';
    await brief.save();

    broadcastSystemNotification({
      title: 'Proposal Accepted & Advance Paid',
      message: `${req.user.name || 'Client'} accepted proposal and paid Milestone 1 Advance ($${milestonesData[0].amount.toLocaleString()}) directly!`,
      senderName: req.user.name || 'Client',
      type: 'milestone',
      tab: 'workspace',
    });

    res.status(201).json({
      contract,
      milestones: createdMilestones,
      message: 'Contract initialized and Advance payment processed directly (zero platform escrow holding).',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create contract' });
  }
}

export async function submitMilestoneDeliverable(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    milestone.submissions.push({
      fileUrls: fileUrls && fileUrls.length > 0 ? fileUrls : ['Deliverable_Handover_Bundle.zip'],
      notes: notes || 'Deliverable source assets and vector package uploaded for client review.',
      submittedAt: new Date(),
    });

    milestone.escrowState = 'in_review';
    // 7 days review window
    milestone.reviewDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await milestone.save();

    broadcastSystemNotification({
      title: 'Deliverable Submitted',
      message: `${req.user.name || 'Freelancer'} submitted deliverable for Milestone ${milestone.milestoneNumber}!`,
      senderName: req.user.name || 'Freelancer',
      type: 'milestone',
      tab: 'workspace',
    });

    res.json({ message: 'Deliverable submitted for review', milestone });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit deliverable' });
  }
}

export async function approveMilestoneAndReleaseEscrow(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    milestone.escrowState = 'released';
    milestone.approvedAt = new Date();
    milestone.releasedAt = new Date();
    milestone.paymentGatewayRef = `DIRECT_PAY_MILESTONE_${Date.now()}`;
    await milestone.save();

    // Check if all milestones are now released
    const allMilestones = await Milestone.find({ contractId: milestone.contractId });
    const allReleased = allMilestones.every((m) => m.escrowState === 'released');
    if (allReleased) {
      await Contract.findByIdAndUpdate(milestone.contractId, { status: 'completed' });
    }

    const contract = await Contract.findById(milestone.contractId);
    if (contract) {
      await TalentProfile.findOneAndUpdate(
        { userId: contract.freelancerId },
        {
          $inc: {
            escrowVolumeEarned: milestone.amount,
            completedContractsCount: allReleased ? 1 : 0,
          },
        }
      );
    }

    broadcastSystemNotification({
      title: 'Milestone Payment Approved',
      message: `${req.user.name || 'Client'} approved Milestone ${milestone.milestoneNumber} ($${milestone.amount.toLocaleString()}) payment directly!`,
      senderName: req.user.name || 'Client',
      type: 'milestone',
      tab: 'workspace',
    });

    res.json({
      message: 'Milestone approved and direct payment completed to talent (zero platform escrow holding)',
      milestone,
      allMilestonesReleased: allReleased,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to process milestone payment' });
  }
}

export async function getActiveContract(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let contract = await Contract.findOne({
      $or: [{ clientId: req.user.id }, { freelancerId: req.user.id }],
      status: 'active',
    })
      .sort({ createdAt: -1 })
      .populate('clientId', 'name handle avatarUrl role')
      .populate('freelancerId', 'name handle avatarUrl role')
      .populate('briefId', 'title category budgetMin budgetMax problemStatement deliverablesRequired');

    if (!contract) {
      // Fallback to latest contract regardless of status
      contract = await Contract.findOne({
        $or: [{ clientId: req.user.id }, { freelancerId: req.user.id }],
      })
        .sort({ createdAt: -1 })
        .populate('clientId', 'name handle avatarUrl role')
        .populate('freelancerId', 'name handle avatarUrl role')
        .populate('briefId', 'title category budgetMin budgetMax problemStatement deliverablesRequired');
    }

    if (!contract) {
      res.json({ contract: null, milestones: [] });
      return;
    }

    const milestones = await Milestone.find({ contractId: contract._id }).sort({ milestoneNumber: 1 });
    res.json({ contract, milestones });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch active contract' });
  }
}

export async function getMyContracts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const contracts = await Contract.find({
      $or: [{ clientId: req.user.id }, { freelancerId: req.user.id }],
    })
      .sort({ createdAt: -1 })
      .populate('clientId', 'name handle avatarUrl role')
      .populate('freelancerId', 'name handle avatarUrl role')
      .populate('briefId', 'title category budgetMin budgetMax');

    const contractIds = contracts.map((c) => c._id);
    const milestones = await Milestone.find({ contractId: { $in: contractIds } }).sort({ milestoneNumber: 1 });

    res.json({ contracts, milestones });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch contracts' });
  }
}

export async function getContractDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { contractId } = req.params;
    if (!contractId || !mongoose.Types.ObjectId.isValid(contractId)) {
      res.status(400).json({ error: 'Valid contractId is required' });
      return;
    }

    const contract = await Contract.findById(contractId)
      .populate('clientId', 'name handle avatarUrl role')
      .populate('freelancerId', 'name handle avatarUrl role')
      .populate('briefId', 'title category budgetMin budgetMax problemStatement deliverablesRequired');

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    const milestones = await Milestone.find({ contractId }).sort({ milestoneNumber: 1 });
    res.json({ contract, milestones });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch contract' });
  }
}
