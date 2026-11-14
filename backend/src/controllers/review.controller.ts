import { Response } from 'express';
import mongoose from 'mongoose';
import { Review, IReview, ReviewStatus } from '../models/Review.model.js';
import { Contract } from '../models/Contract.model.js';
import { TalentProfile } from '../models/TalentProfile.model.js';
import { User } from '../models/User.model.js';
import { AuditLog } from '../models/AuditLog.model.js';
import { Notification } from '../models/Notification.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { broadcastSystemNotification } from '../websocket/socketServer.js';

/**
 * Recalculate reputation aggregates for a user based STRICTLY on published reviews.
 */
export async function recalculateUserReputation(userId: string | mongoose.Types.ObjectId): Promise<void> {
  const userObjectId = new mongoose.Types.ObjectId(userId.toString());

  // Aggregate all PUBLISHED reviews targeting this user
  const publishedReviews = await Review.find({
    targetId: userObjectId,
    status: 'published',
  });

  const count = publishedReviews.length;
  if (count === 0) {
    // If no published reviews, reset to baseline
    await TalentProfile.findOneAndUpdate(
      { userId: userObjectId },
      {
        $set: {
          ratingAverage: 5.0,
          ratingCount: 0,
          communicationScore: 5.0,
          qualityScore: 5.0,
          reliabilityScore: 5.0,
          professionalismScore: 5.0,
          ratingBreakdown: { fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 },
        },
      }
    );

    await User.findByIdAndUpdate(userObjectId, {
      $set: {
        clientRatingAverage: 5.0,
        clientRatingCount: 0,
      },
    });
    return;
  }

  let totalOverall = 0;
  let totalComm = 0;
  let totalProf = 0;
  let totalQual = 0;
  let totalReliability = 0;
  const breakdown = { fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 };

  for (const rev of publishedReviews) {
    totalOverall += rev.overallRating;
    totalComm += rev.communicationRating;
    totalProf += rev.professionalismRating;
    totalQual += rev.qualityRating;
    totalReliability += rev.reliabilityRating;

    const rounded = Math.round(rev.overallRating);
    if (rounded >= 5) breakdown.fiveStar++;
    else if (rounded === 4) breakdown.fourStar++;
    else if (rounded === 3) breakdown.threeStar++;
    else if (rounded === 2) breakdown.twoStar++;
    else breakdown.oneStar++;
  }

  const avgOverall = Number((totalOverall / count).toFixed(2));
  const avgComm = Number((totalComm / count).toFixed(2));
  const avgProf = Number((totalProf / count).toFixed(2));
  const avgQual = Number((totalQual / count).toFixed(2));
  const avgReliability = Number((totalReliability / count).toFixed(2));

  // Count completed contracts
  const completedContractsCount = await Contract.countDocuments({
    $or: [{ freelancerId: userObjectId }, { clientId: userObjectId }],
    status: 'completed',
  });

  // Update freelancer profile if exists
  await TalentProfile.findOneAndUpdate(
    { userId: userObjectId },
    {
      $set: {
        ratingAverage: avgOverall,
        ratingCount: count,
        communicationScore: avgComm,
        professionalismScore: avgProf,
        qualityScore: avgQual,
        reliabilityScore: avgReliability,
        ratingBreakdown: breakdown,
        completedContractsCount,
      },
    }
  );

  // Update client metrics on User model
  await User.findByIdAndUpdate(userObjectId, {
    $set: {
      clientRatingAverage: avgOverall,
      clientRatingCount: count,
      clientCompletedProjectsCount: completedContractsCount,
    },
  });
}

/**
 * Submit a contract review.
 * Enforces contract completion, participant authorization, no self-reviews, no duplicate reviews.
 * Implements double-blind publishing.
 */
export async function createContractReview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const {
      contractId: bodyContractId,
      overallRating,
      communicationRating,
      professionalismRating,
      qualityRating,
      reliabilityRating,
      reviewText,
    } = req.body;

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

    // Contract MUST be completed to be eligible for reviews
    if (contract.status !== 'completed') {
      res.status(400).json({
        error: `Reviews can only be submitted for completed contracts. Current status: ${contract.status}`,
      });
      return;
    }

    const isClient = contract.clientId.toString() === req.user.id.toString();
    const isFreelancer = contract.freelancerId.toString() === req.user.id.toString();

    // Must be participant
    if (!isClient && !isFreelancer && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: You are not a participant of this contract' });
      return;
    }

    const targetId = isClient ? contract.freelancerId : contract.clientId;
    const role: 'client_to_freelancer' | 'freelancer_to_client' = isClient
      ? 'client_to_freelancer'
      : 'freelancer_to_client';

    // Prevent self-review
    const explicitTargetId = req.body.targetId;
    if (explicitTargetId && explicitTargetId.toString() === req.user.id.toString()) {
      res.status(400).json({ error: 'Self-reviews are strictly forbidden' });
      return;
    }
    if (targetId.toString() === req.user.id.toString()) {
      res.status(400).json({ error: 'Self-reviews are strictly forbidden' });
      return;
    }

    // Validate ratings (1-5)
    const ratings = [
      overallRating,
      communicationRating,
      professionalismRating,
      qualityRating,
      reliabilityRating,
    ];
    for (const r of ratings) {
      if (typeof r !== 'number' || isNaN(r) || r < 1 || r > 5) {
        res.status(400).json({
          error: 'All rating scores (overall, communication, professionalism, quality, reliability) must be numbers between 1 and 5',
        });
        return;
      }
    }

    // Validate review text
    if (!reviewText || typeof reviewText !== 'string' || reviewText.trim().length < 10) {
      res.status(400).json({ error: 'Review text must be at least 10 characters long' });
      return;
    }
    if (reviewText.trim().length > 2000) {
      res.status(400).json({ error: 'Review text cannot exceed 2000 characters' });
      return;
    }

    // Check duplicate review
    const existing = await Review.findOne({
      contractId: contract._id,
      reviewerId: req.user.id,
    });
    if (existing) {
      res.status(409).json({ error: 'You have already submitted a review for this contract' });
      return;
    }

    // Check if counterpart has already submitted a review
    const counterpartReview = await Review.findOne({
      contractId: contract._id,
      reviewerId: targetId,
    });

    let initialStatus: ReviewStatus = 'pending_mutual';
    let publishedAt: Date | null = null;

    if (counterpartReview) {
      // Both parties have submitted! Double-blind unlock condition met!
      initialStatus = 'published';
      publishedAt = new Date();
    }

    const newReview = await Review.create({
      contractId: contract._id,
      briefId: contract.briefId,
      reviewerId: req.user.id,
      targetId,
      role,
      overallRating,
      communicationRating,
      professionalismRating,
      qualityRating,
      reliabilityRating,
      reviewText: reviewText.trim(),
      status: initialStatus,
      publishedAt: publishedAt || undefined,
    });

    // If both unlocked, update counterpart review and recalculate aggregates for both
    if (counterpartReview) {
      counterpartReview.status = 'published';
      counterpartReview.publishedAt = publishedAt || new Date();
      await counterpartReview.save();

      // Recalculate reputation for both parties
      await recalculateUserReputation(targetId);
      await recalculateUserReputation(req.user.id);

      // Notify both parties
      await Notification.create({
        userId: targetId,
        senderId: req.user.id,
        contractId: contract._id,
        type: 'info',
        title: 'Review Published',
        message: 'Mutual reviews have been published for your completed contract.',
        linkUrl: `/contracts/${contract._id}`,
      });

      broadcastSystemNotification({
        title: 'Review Published',
        message: 'Your mutual review is now published.',
        type: 'review_published',
      });
    } else {
      // Notify counterpart that a review was submitted and waiting for their review
      await Notification.create({
        userId: targetId,
        senderId: req.user.id,
        contractId: contract._id,
        type: 'info',
        title: 'Pending Review Submitted',
        message: 'The counterpart has submitted their review. Submit yours to unlock and publish both reviews.',
        linkUrl: `/contracts/${contract._id}`,
      });
    }

    await AuditLog.create({
      actorId: req.user.id,
      action: 'review_created',
      targetType: 'contract',
      targetId: contract._id?.toString(),
      metadata: { reviewId: newReview._id?.toString(), status: initialStatus, isMutualPublish: !!counterpartReview },
    });

    res.status(201).json({
      success: true,
      review: newReview,
      mutualPublished: !!counterpartReview,
      message: counterpartReview
        ? 'Both reviews submitted! Your review and your counterpart’s review are now published.'
        : 'Review submitted successfully. It will remain confidential (double-blind) until the counterpart submits their review.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit review' });
  }
}

/**
 * Get review status for a specific contract.
 */
export async function getContractReviewStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    const myReview = await Review.findOne({
      contractId: contract._id,
      reviewerId: req.user.id,
    });

    const counterpartId = isClient ? contract.freelancerId : contract.clientId;
    const counterpartReview = await Review.findOne({
      contractId: contract._id,
      reviewerId: counterpartId,
    });

    res.json({
      contractId: contract.id,
      contractStatus: contract.status,
      eligibleForReview: contract.status === 'completed',
      myReviewSubmitted: !!myReview,
      myReview: myReview || null,
      counterpartReviewSubmitted: !!counterpartReview,
      isMutualPublished: myReview?.status === 'published' && counterpartReview?.status === 'published',
      // Double blind: counterpart review details are ONLY visible if published!
      counterpartReview:
        counterpartReview && counterpartReview.status === 'published'
          ? counterpartReview
          : null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get contract review status' });
  }
}

/**
 * Get published reviews and reputation profile for a user.
 * Strictly excludes pending_mutual, flagged, and hidden reviews.
 */
export async function getUserReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Valid user ID is required' });
      return;
    }

    const targetUser = await User.findById(userId).select('name handle avatarUrl role');
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    // Filter STRICTLY by published status
    const filter: Record<string, any> = {
      targetId: new mongoose.Types.ObjectId(userId),
      status: 'published',
    };

    const totalReviews = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('reviewerId', 'name handle avatarUrl role')
      .populate('contractId', 'briefId totalBudget currency startDate actualCompletionDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get aggregated profile data
    const talentProfile = await TalentProfile.findOne({ userId: targetUser._id });

    res.json({
      targetUser,
      totalReviews,
      page,
      limit,
      totalPages: Math.ceil(totalReviews / limit),
      reviews,
      reputationSummary: {
        ratingAverage: talentProfile?.ratingAverage || targetUser.clientRatingAverage || 5.0,
        ratingCount: totalReviews,
        communicationScore: talentProfile?.communicationScore || 5.0,
        qualityScore: talentProfile?.qualityScore || 5.0,
        reliabilityScore: talentProfile?.reliabilityScore || 5.0,
        professionalismScore: talentProfile?.professionalismScore || 5.0,
        ratingBreakdown: talentProfile?.ratingBreakdown || {
          fiveStar: 0,
          fourStar: 0,
          threeStar: 0,
          twoStar: 0,
          oneStar: 0,
        },
        completedContractsCount: talentProfile?.completedContractsCount || targetUser.clientCompletedProjectsCount || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch user reviews' });
  }
}

/**
 * Edit an existing review (within allowed edit window or policy).
 */
export async function editReview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const { reviewId } = req.params;
    const {
      overallRating,
      communicationRating,
      professionalismRating,
      qualityRating,
      reliabilityRating,
      reviewText,
    } = req.body;

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ error: 'Valid review ID is required' });
      return;
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    // Only reviewer or admin can edit
    if (review.reviewerId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: You can only edit your own reviews' });
      return;
    }

    if (review.status === 'hidden') {
      res.status(400).json({ error: 'Cannot edit a hidden or moderated review' });
      return;
    }

    if (reviewText !== undefined) {
      if (typeof reviewText !== 'string' || reviewText.trim().length < 10) {
        res.status(400).json({ error: 'Review text must be at least 10 characters long' });
        return;
      }
      if (reviewText.trim().length > 2000) {
        res.status(400).json({ error: 'Review text cannot exceed 2000 characters' });
        return;
      }
      review.reviewText = reviewText.trim();
    }

    if (overallRating !== undefined) {
      if (typeof overallRating !== 'number' || overallRating < 1 || overallRating > 5) {
        res.status(400).json({ error: 'Overall rating must be between 1 and 5' });
        return;
      }
      review.overallRating = overallRating;
    }
    if (communicationRating !== undefined) review.communicationRating = communicationRating;
    if (professionalismRating !== undefined) review.professionalismRating = professionalismRating;
    if (qualityRating !== undefined) review.qualityRating = qualityRating;
    if (reliabilityRating !== undefined) review.reliabilityRating = reliabilityRating;

    review.isEdited = true;
    review.editedAt = new Date();
    await review.save();

    // Recalculate reputation if published
    if (review.status === 'published') {
      await recalculateUserReputation(review.targetId);
    }

    res.json({ success: true, review });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to edit review' });
  }
}

/**
 * Auto-publish single review after review window expiry (or manual release).
 */
export async function autoPublishReview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const { reviewId } = req.params;
    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ error: 'Valid review ID is required' });
      return;
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    if (review.status === 'published') {
      res.json({ success: true, message: 'Review is already published', review });
      return;
    }

    review.status = 'published';
    review.publishedAt = new Date();
    await review.save();

    await recalculateUserReputation(review.targetId);

    res.json({ success: true, message: 'Review published successfully', review });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to auto-publish review' });
  }
}

/**
 * Report/flag a review for moderation.
 */
export async function reportReview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const { reviewId } = req.params;
    const { reason } = req.body;

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ error: 'Valid review ID is required' });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ error: 'Reason for flagging is required' });
      return;
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    review.flagReason = reason.trim();
    if (review.status === 'published') {
      review.status = 'flagged';
    }
    await review.save();

    await AuditLog.create({
      actorId: req.user.id,
      action: 'review_flagged',
      targetType: 'review',
      targetId: review._id?.toString(),
      metadata: { reason: reason.trim() },
    });

    res.json({ success: true, message: 'Review flagged for moderation review', review });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to report review' });
  }
}

/**
 * Moderator / Admin endpoint to list reviews for moderation.
 */
export async function getAdminReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    const status = req.query.status as string;
    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    const reviews = await Review.find(filter)
      .populate('reviewerId', 'name handle email avatarUrl')
      .populate('targetId', 'name handle email avatarUrl')
      .populate('contractId', 'briefId totalBudget currency')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ reviews });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch admin reviews' });
  }
}

/**
 * Moderator / Admin action on review: publish, hide, or dismiss flag.
 */
export async function moderateReview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    const { reviewId } = req.params;
    const { action, moderatorNotes } = req.body;

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ error: 'Valid review ID is required' });
      return;
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    if (!['publish', 'hide', 'dismiss'].includes(action)) {
      res.status(400).json({ error: 'Action must be one of: publish, hide, dismiss' });
      return;
    }

    if (action === 'hide') {
      review.status = 'hidden';
    } else if (action === 'publish' || action === 'dismiss') {
      review.status = 'published';
      if (!review.publishedAt) review.publishedAt = new Date();
    }

    if (moderatorNotes) review.moderatorNotes = moderatorNotes;
    await review.save();

    // Recalculate reputation to ensure hidden reviews are removed from aggregates!
    await recalculateUserReputation(review.targetId);

    await AuditLog.create({
      actorId: req.user.id,
      action: `review_moderated_${action}`,
      targetType: 'review',
      targetId: review._id?.toString(),
      metadata: { action, moderatorNotes },
    });

    res.json({ success: true, message: `Review action '${action}' applied successfully`, review });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to moderate review' });
  }
}
