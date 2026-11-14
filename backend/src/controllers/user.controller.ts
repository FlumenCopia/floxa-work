import { Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { TalentProfile } from '../models/TalentProfile.model.js';
import { Contract } from '../models/Contract.model.js';
import { Milestone } from '../models/Milestone.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export async function getUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let profile = await TalentProfile.findOne({ userId: req.user.id });
    if (!profile && (user.role === 'freelancer' || user.role === 'dual')) {
      profile = await TalentProfile.create({
        userId: user._id,
        headline: 'Creative & Technical Consultant',
        bio: 'Passionate about delivering exceptional outcomes via discovery-first workflows.',
        skills: ['Brand Identity', 'Design Systems', 'UI/UX'],
        hourlyRate: 85,
      });
    }

    // Dynamic stats from real contracts and milestones in MongoDB
    const contracts = await Contract.find({
      $or: [{ clientId: user._id }, { freelancerId: user._id }],
    });

    const contractIds = contracts.map((c) => c._id);
    const milestones = await Milestone.find({ contractId: { $in: contractIds } });

    const activeContractsCount = contracts.filter((c) => c.status === 'active').length;
    const completedContractsCount = contracts.filter((c) => c.status === 'completed').length;
    const totalVolume = milestones
      .filter(
        (m) =>
          m.paymentStatus === 'acknowledged_by_freelancer' ||
          m.deliverableStatus === 'approved' ||
          m.escrowState === 'released'
      )
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    res.json({
      user,
      profile,
      stats: {
        activeContractsCount,
        completedContractsCount,
        totalVolume,
        ratingAverage: profile?.ratingAverage || 5.0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch user profile' });
  }
}

export async function updateUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      name,
      handle,
      avatarUrl,
      headline,
      bio,
      skills,
      hourlyRate,
      minimumProjectBudget,
      availabilityStatus,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (name && typeof name === 'string') user.name = name.trim();
    if (handle && typeof handle === 'string') {
      const cleanHandle = handle.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
      const existing = await User.findOne({ handle: cleanHandle, _id: { $ne: user._id } });
      if (existing) {
        res.status(409).json({ error: 'Handle is already in use by another member' });
        return;
      }
      user.handle = cleanHandle;
    }
    if (avatarUrl !== undefined && typeof avatarUrl === 'string') {
      user.avatarUrl = avatarUrl.trim();
    }

    await user.save();

    let profile = await TalentProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new TalentProfile({ userId: user._id });
    }

    if (headline !== undefined) profile.headline = String(headline).trim();
    if (bio !== undefined) profile.bio = String(bio).trim();
    if (skills !== undefined) {
      profile.skills = Array.isArray(skills)
        ? skills.map((s: any) => String(s).trim())
        : String(skills)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (hourlyRate !== undefined) profile.hourlyRate = Number(hourlyRate) || 0;
    if (minimumProjectBudget !== undefined) profile.minimumProjectBudget = Number(minimumProjectBudget) || 0;
    if (availabilityStatus && ['available', 'busy', 'not_looking'].includes(availabilityStatus)) {
      profile.availabilityStatus = availabilityStatus;
    }

    await profile.save();

    res.json({
      message: 'Profile updated successfully in database',
      user,
      profile,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
}

