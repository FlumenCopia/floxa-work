import { Response } from 'express';
import { Proposal } from '../models/Proposal.model.js';
import { Brief } from '../models/Brief.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { broadcastSystemNotification } from '../websocket/socketServer.js';

export async function submitMiniDiscoveryProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      briefId,
      diagnosticAnswers,
      strategicSliders,
      proposedMilestones,
      totalPrice,
      estimatedDays,
      portfolioProofUrls,
    } = req.body;

    if (!briefId || !diagnosticAnswers || !proposedMilestones || !totalPrice) {
      res.status(400).json({ error: 'Missing required proposal fields' });
      return;
    }

    const brief = await Brief.findById(briefId);
    if (!brief) {
      res.status(404).json({ error: 'Target brief not found' });
      return;
    }

    const existing = await Proposal.findOne({ briefId, freelancerId: req.user.id });
    if (existing) {
      res.status(409).json({ error: 'You have already submitted a Mini-Discovery pitch for this brief.' });
      return;
    }

    const normalizedMilestones = proposedMilestones.map((m: any, index: number) => ({
      title: m.title || `Milestone ${index + 1}`,
      description: m.description || '',
      amount: Number(m.amount || 0),
      deliveryDays: Number(m.deliveryDays || m.estimatedDays || 7),
    }));

    const proposal = await Proposal.create({
      briefId,
      freelancerId: req.user.id,
      diagnosticAnswers,
      strategicSliders: strategicSliders || [],
      proposedMilestones: normalizedMilestones,
      totalPrice,
      estimatedDays: estimatedDays || 21,
      portfolioProofUrls: portfolioProofUrls || [],
    });

    await Brief.findByIdAndUpdate(briefId, { $inc: { proposalsCount: 1 } });

    broadcastSystemNotification({
      title: 'New Mini-Discovery Pitch',
      message: `${req.user.name || 'Freelancer'} submitted a pitch for "${brief.title}" ($${Number(totalPrice).toLocaleString()})`,
      senderName: req.user.name || 'Freelancer',
      type: 'proposal',
      tab: 'mini-discovery',
    });

    res.status(201).json({ proposal });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit proposal' });
  }
}

export async function getBriefProposals(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { briefId } = req.params;
    const proposals = await Proposal.find({ briefId })
      .populate('freelancerId', 'name handle avatarUrl isVerified')
      .sort({ createdAt: -1 });

    res.json({ proposals });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch proposals' });
  }
}

export async function getMyProposals(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role === 'client') {
      const clientBriefs = await Brief.find({ clientId: req.user.id }).select('_id');
      const briefIds = clientBriefs.map((b) => b._id);
      const proposals = await Proposal.find({ briefId: { $in: briefIds } })
        .populate('freelancerId', 'name handle avatarUrl isVerified')
        .populate('briefId', 'title category budgetMin budgetMax')
        .sort({ createdAt: -1 });

      res.json({ proposals });
      return;
    }

    // Freelancer
    const proposals = await Proposal.find({ freelancerId: req.user.id })
      .populate('briefId', 'title category budgetMin budgetMax clientId')
      .sort({ createdAt: -1 });

    res.json({ proposals });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch proposals' });
  }
}

