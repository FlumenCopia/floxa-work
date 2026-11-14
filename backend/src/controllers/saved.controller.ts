import { Response } from 'express';
import mongoose from 'mongoose';
import { SavedItem } from '../models/SavedItem.model.js';
import { TalentProfile } from '../models/TalentProfile.model.js';
import { Brief } from '../models/Brief.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export async function saveFreelancer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { notes } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Valid freelancer ID is required' });
      return;
    }

    // Verify freelancer exists
    const profile = await TalentProfile.findOne({
      $or: [{ _id: id }, { userId: id }],
    });
    if (!profile) {
      res.status(404).json({ error: 'Freelancer profile not found' });
      return;
    }

    const targetId = profile.userId;

    const existing = await SavedItem.findOne({
      userId: req.user.id,
      itemType: 'freelancer',
      itemId: targetId,
    });
    if (existing) {
      res.status(409).json({ error: 'Freelancer is already saved in your shortlist', saved: existing });
      return;
    }

    const saved = await SavedItem.create({
      userId: req.user.id,
      itemType: 'freelancer',
      itemId: targetId,
      notes: notes || '',
    });

    res.status(201).json({ message: 'Freelancer saved to your private list', saved });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save freelancer' });
  }
}

export async function removeSavedFreelancer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    await SavedItem.findOneAndDelete({
      userId: req.user.id,
      itemType: 'freelancer',
      $or: [{ itemId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }],
    });

    res.json({ message: 'Freelancer removed from saved list' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to remove saved freelancer' });
  }
}

export async function getSavedFreelancers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const savedItems = await SavedItem.find({
      userId: req.user.id,
      itemType: 'freelancer',
    }).sort({ createdAt: -1 });

    const freelancerUserIds = savedItems.map((s) => s.itemId);
    const profiles = await TalentProfile.find({
      userId: { $in: freelancerUserIds },
    }).populate('userId', 'name handle avatarUrl isVerified role');

    res.json({ savedFreelancers: profiles, count: profiles.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve saved freelancers' });
  }
}

export async function saveProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { notes } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Valid project ID is required' });
      return;
    }

    const brief = await Brief.findById(id);
    if (!brief) {
      res.status(404).json({ error: 'Project brief not found' });
      return;
    }

    const existing = await SavedItem.findOne({
      userId: req.user.id,
      itemType: 'project',
      itemId: brief._id,
    });
    if (existing) {
      res.status(409).json({ error: 'Project brief is already saved in your bookmarks', saved: existing });
      return;
    }

    const saved = await SavedItem.create({
      userId: req.user.id,
      itemType: 'project',
      itemId: brief._id,
      notes: notes || '',
    });

    res.status(201).json({ message: 'Project saved to your private list', saved });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save project' });
  }
}

export async function removeSavedProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    await SavedItem.findOneAndDelete({
      userId: req.user.id,
      itemType: 'project',
      $or: [{ itemId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }],
    });

    res.json({ message: 'Project removed from saved list' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to remove saved project' });
  }
}

export async function getSavedProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const savedItems = await SavedItem.find({
      userId: req.user.id,
      itemType: 'project',
    }).sort({ createdAt: -1 });

    const briefIds = savedItems.map((s) => s.itemId);
    const briefs = await Brief.find({
      _id: { $in: briefIds },
    }).populate('clientId', 'name handle avatarUrl isVerified');

    res.json({ savedProjects: briefs, count: briefs.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve saved projects' });
  }
}
