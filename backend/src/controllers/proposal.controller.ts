import { Response } from 'express';
import mongoose from 'mongoose';
import { Proposal } from '../models/Proposal.model.js';
import { Brief } from '../models/Brief.model.js';
import { AuditLog } from '../models/AuditLog.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { broadcastSystemNotification } from '../websocket/socketServer.js';

export async function submitMiniDiscoveryProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    const {
      briefId,
      diagnosticAnswers,
      problemDiagnosis,
      proposedStrategy,
      strategicSliders,
      proposedMilestones,
      totalPrice,
      currency,
      pricingModel,
      estimatedDays,
      assumptionsAndExclusions,
      portfolioItems,
      portfolioProofUrls,
      freelancerIntro,
    } = req.body;

    if (!briefId || !totalPrice || !proposedMilestones || (!diagnosticAnswers && !problemDiagnosis)) {
      res.status(400).json({
        error: 'Missing required proposal fields: briefId, totalPrice, proposedMilestones, and problem diagnosis are required.',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(briefId)) {
      res.status(400).json({ error: 'Invalid briefId provided.' });
      return;
    }

    const brief = await Brief.findById(briefId);
    if (!brief) {
      res.status(404).json({ error: 'Target discovery brief not found.' });
      return;
    }

    // Check if brief is assigned or completed
    if (brief.status === 'assigned' || brief.status === 'completed') {
      res.status(400).json({ error: 'This brief is already assigned or completed and is no longer accepting proposals.' });
      return;
    }

    // Check if freelancer has already submitted for this brief
    const existing = await Proposal.findOne({ briefId, freelancerId: req.user.id });
    if (existing) {
      res.status(409).json({ error: 'You have already submitted a Mini-Discovery pitch for this brief.' });
      return;
    }

    // Milestone reconciliation validation
    const normalizedMilestones = (proposedMilestones || []).map((m: any, index: number) => ({
      title: m.title || `Milestone ${index + 1}`,
      description: m.description || '',
      deliverables: m.deliverables || [],
      amount: Math.round(Number(m.amount || 0)),
      deliveryDays: Number(m.deliveryDays || m.estimatedDays || 7),
      acceptanceCriteria: m.acceptanceCriteria || '',
      revisionAssumptions: m.revisionAssumptions || 'Up to 2 iterative refinement rounds included.',
    }));

    if (normalizedMilestones.length === 0) {
      res.status(400).json({ error: 'At least one milestone is required in the execution plan.' });
      return;
    }

    const milestoneSum = normalizedMilestones.reduce((acc: number, m: any) => acc + m.amount, 0);
    const parsedTotal = Math.round(Number(totalPrice));

    if (Math.abs(milestoneSum - parsedTotal) > 2) {
      res.status(400).json({
        error: `Milestone amounts ($${milestoneSum.toLocaleString()}) must reconcile with total bid price ($${parsedTotal.toLocaleString()}).`,
      });
      return;
    }

    // Build unified diagnostic answers
    const unifiedAnswers = diagnosticAnswers && diagnosticAnswers.length > 0
      ? diagnosticAnswers
      : [
          {
            question: 'Problem Diagnosis',
            answer: problemDiagnosis?.understanding || 'Structured diagnostic analysis provided.',
          },
        ];

    // Structured diagnosis
    const structuredDiagnosis = {
      understanding: problemDiagnosis?.understanding || unifiedAnswers[0]?.answer || '',
      rootCauses: problemDiagnosis?.rootCauses || [],
      risksAndConstraints: problemDiagnosis?.risksAndConstraints || [],
      clarifyingQuestions: problemDiagnosis?.clarifyingQuestions || [],
    };

    // Structured strategy
    const structuredStrategy = {
      strategicApproach: proposedStrategy?.strategicApproach || 'Discovery-first staged execution methodology.',
      solutionArchitecture: proposedStrategy?.solutionArchitecture || '',
      expectedOutcomes: proposedStrategy?.expectedOutcomes || [],
      dependencies: proposedStrategy?.dependencies || [],
      alternativeApproaches: proposedStrategy?.alternativeApproaches || '',
    };

    const proposal = await Proposal.create({
      briefId,
      freelancerId: req.user.id,
      diagnosticAnswers: unifiedAnswers,
      problemDiagnosis: structuredDiagnosis,
      proposedStrategy: structuredStrategy,
      strategicSliders: strategicSliders || [{ key: 'craft_direction', value: 80, rationale: 'High craft and reliability focus' }],
      proposedMilestones: normalizedMilestones,
      totalPrice: parsedTotal,
      currency: currency || brief.currency || 'USD',
      pricingModel: pricingModel || 'fixed_milestone_direct',
      estimatedDays: Number(estimatedDays || 21),
      assumptionsAndExclusions: assumptionsAndExclusions || '',
      portfolioItems: portfolioItems || [],
      portfolioProofUrls: portfolioProofUrls || [],
      freelancerIntro: freelancerIntro || {
        coverNote: 'Excited to diagnose and execute this engagement with precision.',
        relevantExperience: 'Experienced specialist with verified track record in discovery and delivery.',
        availability: 'Available immediately (30-40 hrs/wk)',
      },
      status: 'pending',
    });

    await Brief.findByIdAndUpdate(briefId, { $inc: { proposalsCount: 1 } });

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await AuditLog.create({
      actorId: req.user.id,
      action: 'PROPOSAL_SUBMITTED',
      targetType: 'Proposal',
      targetId: proposal.id,
      ipAddress,
      userAgent,
      metadata: { briefId: brief.id, totalPrice: parsedTotal, milestoneCount: normalizedMilestones.length },
    });

    broadcastSystemNotification({
      title: 'New Mini-Discovery Pitch',
      message: `${req.user.name || 'Freelancer'} submitted a diagnostic pitch for "${brief.title}" ($${parsedTotal.toLocaleString()})`,
      senderName: req.user.name || 'Freelancer',
      type: 'proposal',
      tab: 'mini-discovery',
    });

    res.status(201).json({
      message: 'Mini-Discovery proposal submitted successfully.',
      proposal,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit proposal' });
  }
}

export async function getBriefProposals(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    const { briefId } = req.params;
    if (!briefId || !mongoose.Types.ObjectId.isValid(briefId)) {
      res.status(400).json({ error: 'Valid briefId is required.' });
      return;
    }

    const brief = await Brief.findById(briefId);
    if (!brief) {
      res.status(404).json({ error: 'Discovery brief not found.' });
      return;
    }

    // STRICT BRIEF ACCESS CONTROL: Only the brief creator or admin can view all competing proposals!
    if (brief.clientId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden: You can only view proposals submitted to your own discovery briefs.',
      });
      return;
    }

    const { status, sortBy, search } = req.query;

    const query: any = { briefId };
    if (status && status !== 'all') {
      query.status = status;
    }

    let sortOption: any = { createdAt: -1 };
    if (sortBy === 'price_asc') sortOption = { totalPrice: 1 };
    else if (sortBy === 'price_desc') sortOption = { totalPrice: -1 };
    else if (sortBy === 'days_asc') sortOption = { estimatedDays: 1 };
    else if (sortBy === 'recent') sortOption = { createdAt: -1 };

    let proposals = await Proposal.find(query)
      .populate('freelancerId', 'name handle avatarUrl isVerified email role')
      .sort(sortOption);

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      proposals = proposals.filter((p: any) => {
        const name = p.freelancerId?.name?.toLowerCase() || '';
        const handle = p.freelancerId?.handle?.toLowerCase() || '';
        const diag = p.problemDiagnosis?.understanding?.toLowerCase() || p.diagnosticAnswers?.[0]?.answer?.toLowerCase() || '';
        return name.includes(q) || handle.includes(q) || diag.includes(q);
      });
    }

    res.json({
      brief: {
        id: brief.id,
        title: brief.title,
        category: brief.category,
        budgetMin: brief.budgetMin,
        budgetMax: brief.budgetMax,
        currency: brief.currency,
        status: brief.status,
      },
      proposals,
      count: proposals.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch proposals' });
  }
}

export async function getProposalById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Valid proposal ID is required.' });
      return;
    }

    const proposal = await Proposal.findById(id)
      .populate('freelancerId', 'name handle avatarUrl isVerified email role')
      .populate('briefId', 'title category budgetMin budgetMax clientId status');

    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found.' });
      return;
    }

    const brief = proposal.briefId as any;
    const isOwnerFreelancer = proposal.freelancerId && (proposal.freelancerId as any)._id?.toString() === req.user.id.toString();
    const isOwnerClient = brief && brief.clientId?.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwnerFreelancer && !isOwnerClient && !isAdmin) {
      res.status(403).json({ error: 'Access denied: You do not have permission to view this proposal.' });
      return;
    }

    res.json({ proposal });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve proposal.' });
  }
}

export async function shortlistProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const proposal = await Proposal.findById(id);
    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    const brief = await Brief.findById(proposal.briefId);
    if (!brief || (brief.clientId.toString() !== req.user.id.toString() && req.user.role !== 'admin')) {
      res.status(403).json({ error: 'Only the brief client can shortlist proposals.' });
      return;
    }

    // Toggle shortlist state
    const isCurrentlyShortlisted = proposal.status === 'shortlisted';
    proposal.status = isCurrentlyShortlisted ? 'pending' : 'shortlisted';
    proposal.shortlistedAt = isCurrentlyShortlisted ? null as any : new Date();
    await proposal.save();

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    await AuditLog.create({
      actorId: req.user.id,
      action: isCurrentlyShortlisted ? 'PROPOSAL_UNSHORTLISTED' : 'PROPOSAL_SHORTLISTED',
      targetType: 'Proposal',
      targetId: proposal.id,
      ipAddress,
      metadata: { briefId: brief.id, newStatus: proposal.status },
    });

    res.json({
      message: isCurrentlyShortlisted ? 'Proposal removed from shortlist' : 'Proposal added to shortlist',
      proposal,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update shortlist status' });
  }
}

export async function declineProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    const proposal = await Proposal.findById(id);
    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    const brief = await Brief.findById(proposal.briefId);
    if (!brief || (brief.clientId.toString() !== req.user.id.toString() && req.user.role !== 'admin')) {
      res.status(403).json({ error: 'Only the brief client can decline proposals.' });
      return;
    }

    if (proposal.status === 'accepted') {
      res.status(400).json({ error: 'Cannot decline an accepted proposal that has an active contract.' });
      return;
    }

    proposal.status = 'declined';
    proposal.declinedAt = new Date();
    proposal.clientFeedback = reason || 'Proposal was not selected for this project.';
    await proposal.save();

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    await AuditLog.create({
      actorId: req.user.id,
      action: 'PROPOSAL_DECLINED',
      targetType: 'Proposal',
      targetId: proposal.id,
      ipAddress,
      metadata: { briefId: brief.id, reason },
    });

    res.json({ message: 'Proposal declined', proposal });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to decline proposal' });
  }
}

export async function withdrawProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const proposal = await Proposal.findById(id);
    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    if (proposal.freelancerId.toString() !== req.user.id.toString()) {
      res.status(403).json({ error: 'Only the proposal author can withdraw this proposal.' });
      return;
    }

    if (proposal.status === 'accepted') {
      res.status(400).json({ error: 'Cannot withdraw an accepted proposal with an active project agreement.' });
      return;
    }

    proposal.status = 'withdrawn';
    await proposal.save();

    await Brief.findByIdAndUpdate(proposal.briefId, { $inc: { proposalsCount: -1 } });

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    await AuditLog.create({
      actorId: req.user.id,
      action: 'PROPOSAL_WITHDRAWN',
      targetType: 'Proposal',
      targetId: proposal.id,
      ipAddress,
      metadata: { briefId: proposal.briefId },
    });

    res.json({ message: 'Proposal withdrawn successfully', proposal });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to withdraw proposal' });
  }
}

export async function compareProposals(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { briefId, proposalIds } = req.body;
    if (!briefId || !proposalIds || !Array.isArray(proposalIds) || proposalIds.length < 2) {
      res.status(400).json({ error: 'Please select at least 2 proposals (up to 4) to compare.' });
      return;
    }

    if (proposalIds.length > 4) {
      res.status(400).json({ error: 'Maximum of 4 proposals can be compared simultaneously.' });
      return;
    }

    const brief = await Brief.findById(briefId);
    if (!brief) {
      res.status(404).json({ error: 'Discovery brief not found.' });
      return;
    }

    if (brief.clientId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: You can only compare proposals for your own discovery brief.' });
      return;
    }

    const proposals = await Proposal.find({
      _id: { $in: proposalIds },
      briefId,
    }).populate('freelancerId', 'name handle avatarUrl isVerified email role');

    if (proposals.length < 2) {
      res.status(400).json({ error: 'Could not find the selected proposals for comparison.' });
      return;
    }

    // Compute transparent difference indicators
    const prices = proposals.map((p) => p.totalPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const days = proposals.map((p) => p.estimatedDays);
    const minDays = Math.min(...days);
    const maxDays = Math.max(...days);

    const milestoneCounts = proposals.map((p) => p.proposedMilestones.length);
    const minMilestones = Math.min(...milestoneCounts);
    const maxMilestones = Math.max(...milestoneCounts);

    const comparisonMetrics = {
      priceRange: { min: minPrice, max: maxPrice, delta: maxPrice - minPrice },
      timelineRange: { minDays, maxDays, deltaDays: maxDays - minDays },
      milestoneCounts: { minCount: minMilestones, maxCount: maxMilestones },
      proposalsCompared: proposals.length,
    };

    res.json({
      brief: {
        id: brief.id,
        title: brief.title,
        category: brief.category,
        budgetMin: brief.budgetMin,
        budgetMax: brief.budgetMax,
        currency: brief.currency,
      },
      proposals,
      comparisonMetrics,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate proposal comparison.' });
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
