import { Request, Response } from 'express';
import { SocialPost } from '../models/SocialPost.model.js';
import { TalentProfile } from '../models/TalentProfile.model.js';
import { User } from '../models/User.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export async function getSocialFeed(req: Request, res: Response): Promise<void> {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const filter: Record<string, any> = {};
    if (category && category !== 'all') {
      filter.projectCategory = category;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const posts = await SocialPost.find(filter)
      .populate('authorId', 'name handle avatarUrl isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await SocialPost.countDocuments(filter);

    res.json({
      posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch social feed' });
  }
}

export async function createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { caption, mediaUrls, mediaType, tags, projectCategory, caseStudyMetrics } = req.body;
    if (!caption) {
      res.status(400).json({ error: 'Caption is required' });
      return;
    }

    const post = await SocialPost.create({
      authorId: req.user.id,
      caption,
      mediaUrls: mediaUrls || [],
      mediaType: mediaType || 'image',
      tags: tags || [],
      projectCategory: projectCategory || 'branding',
      caseStudyMetrics: caseStudyMetrics || {},
    });

    const populated = await post.populate('authorId', 'name handle avatarUrl isVerified');
    res.status(201).json({ post: populated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create post' });
  }
}

export async function likePost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { postId } = req.params;
    const post = await SocialPost.findById(postId);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const userIdStr = req.user.id;
    const isLiked = post.likedBy.some((id) => id.toString() === userIdStr);

    if (isLiked) {
      post.likedBy = post.likedBy.filter((id) => id.toString() !== userIdStr);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likedBy.push(userIdStr as any);
      post.likesCount += 1;
    }

    await post.save();
    res.json({ likesCount: post.likesCount, isLiked: !isLiked });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update like status' });
  }
}

export async function getTopTalent(req: Request, res: Response): Promise<void> {
  try {
    const { skill, availableOnly } = req.query;
    const filter: Record<string, any> = {};
    if (availableOnly === 'true') {
      filter.availabilityStatus = 'available';
    }
    if (skill) {
      filter.skills = { $in: [skill] };
    }

    const profiles = await TalentProfile.find(filter)
      .populate('userId', 'name handle avatarUrl isVerified role')
      .sort({ escrowVolumeEarned: -1, ratingAverage: -1 })
      .limit(15);

    res.json({ talent: profiles });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch talent' });
  }
}

