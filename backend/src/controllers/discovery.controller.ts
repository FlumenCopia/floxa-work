import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { TalentProfile } from '../models/TalentProfile.model.js';
import { Brief } from '../models/Brief.model.js';
import { calculateCompatibility } from '../services/matching.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export async function searchFreelancers(req: Request, res: Response): Promise<void> {
  try {
    const {
      q,
      category,
      skill,
      industry,
      minRate,
      maxRate,
      availability,
      verifiedOnly,
      briefId,
      sortBy = 'match',
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const profileFilter: Record<string, any> = {};

    if (availability && availability !== 'all') {
      profileFilter.availabilityStatus = availability;
    }
    if (category && category !== 'all') {
      profileFilter.$or = [
        { primaryCategory: category },
        { specializations: { $in: [category] } },
      ];
    }
    if (skill) {
      profileFilter.skills = { $in: [new RegExp(skill as string, 'i')] };
    }
    if (industry) {
      profileFilter.industries = { $in: [new RegExp(industry as string, 'i')] };
    }
    if (minRate || maxRate) {
      profileFilter.hourlyRate = {};
      if (minRate) profileFilter.hourlyRate.$gte = Number(minRate);
      if (maxRate) profileFilter.hourlyRate.$lte = Number(maxRate);
    }

    // Text search query across user name/handle and profile headline/bio
    let matchingUserIds: any[] | null = null;
    if (q && typeof q === 'string' && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      const users = await User.find({
        role: { $in: ['freelancer', 'dual'] },
        $or: [{ name: searchRegex }, { handle: searchRegex }],
      }).select('_id');
      const uIds = users.map((u) => u._id);

      profileFilter.$or = [
        ...(profileFilter.$or || []),
        { userId: { $in: uIds } },
        { headline: searchRegex },
        { bio: searchRegex },
        { skills: { $in: [searchRegex] } },
        { specializations: { $in: [searchRegex] } },
      ];
    }

    // Verified filter
    let userFilter: Record<string, any> = { role: { $in: ['freelancer', 'dual'] } };
    if (verifiedOnly === 'true') {
      userFilter.isVerified = true;
    }

    let profiles = await TalentProfile.find(profileFilter)
      .populate({
        path: 'userId',
        match: userFilter,
        select: 'name handle avatarUrl isVerified role createdAt',
      })
      .exec();

    // Filter out profiles whose user didn't match userFilter (e.g. non-freelancer or unverified)
    profiles = profiles.filter((p) => p.userId != null);

    // Optional brief context for Intelligent Matching
    let briefDoc: any = null;
    if (briefId && mongoose.Types.ObjectId.isValid(briefId as string)) {
      briefDoc = await Brief.findById(briefId);
    }

    // Calculate match scores if brief is supplied or for general relevance
    const scoredProfiles = profiles.map((p) => {
      const pObj: any = p.toJSON();
      if (briefDoc) {
        const matchResult = calculateCompatibility(briefDoc, p);
        pObj.matchResult = matchResult;
        pObj.matchScore = matchResult.overallScore;
      } else {
        pObj.matchScore = p.ratingAverage * 15 + Math.min(25, p.completedContractsCount * 5);
      }
      return pObj;
    });

    // Sorting
    if (sortBy === 'match' && briefDoc) {
      scoredProfiles.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else if (sortBy === 'rate_asc') {
      scoredProfiles.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
    } else if (sortBy === 'rate_desc') {
      scoredProfiles.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
    } else if (sortBy === 'experience') {
      scoredProfiles.sort((a, b) => (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0));
    } else {
      // Default: sort by rating & earnings
      scoredProfiles.sort((a, b) => (b.escrowVolumeEarned || 0) - (a.escrowVolumeEarned || 0));
    }

    const totalCount = scoredProfiles.length;
    const paginated = scoredProfiles.slice(skip, skip + limitNum);

    res.json({
      freelancers: paginated,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum),
      },
      briefContext: briefDoc ? { id: briefDoc.id, title: briefDoc.title, category: briefDoc.category } : null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to search freelancers' });
  }
}

export async function getFreelancerDiscoveryDetails(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { briefId } = req.query;

    let profile: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      profile = await TalentProfile.findOne({
        $or: [{ _id: id }, { userId: id }],
      }).populate('userId', 'name handle avatarUrl isVerified role createdAt');
    }

    if (!profile) {
      // Try handle
      const user = await User.findOne({ handle: id.toLowerCase() });
      if (user) {
        profile = await TalentProfile.findOne({ userId: user._id }).populate(
          'userId',
          'name handle avatarUrl isVerified role createdAt'
        );
      }
    }

    if (!profile) {
      res.status(404).json({ error: 'Freelancer profile not found' });
      return;
    }

    const pObj: any = profile.toJSON();

    if (briefId && mongoose.Types.ObjectId.isValid(briefId as string)) {
      const briefDoc = await Brief.findById(briefId);
      if (briefDoc) {
        pObj.matchResult = calculateCompatibility(briefDoc, profile);
      }
    }

    res.json({ freelancer: pObj });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve freelancer details' });
  }
}

export async function searchProjects(req: Request, res: Response): Promise<void> {
  try {
    const {
      q,
      category,
      skill,
      industry,
      minBudget,
      maxBudget,
      status = 'open',
      sortBy = 'recent',
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (industry) {
      filter.industry = new RegExp(industry as string, 'i');
    }
    if (skill) {
      filter.$or = [
        { requiredSkills: { $in: [new RegExp(skill as string, 'i')] } },
        { deliverablesRequired: { $in: [new RegExp(skill as string, 'i')] } },
      ];
    }
    if (minBudget || maxBudget) {
      if (minBudget) filter.budgetMax = { $gte: Number(minBudget) };
      if (maxBudget) filter.budgetMin = { $lte: Number(maxBudget) };
    }

    if (q && typeof q === 'string' && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        ...(filter.$or || []),
        { title: searchRegex },
        { problemStatement: searchRegex },
        { requiredSkills: { $in: [searchRegex] } },
        { deliverablesRequired: { $in: [searchRegex] } },
      ];
    }

    let sortOption: any = { createdAt: -1 };
    if (sortBy === 'budget_desc') sortOption = { budgetMax: -1 };
    else if (sortBy === 'budget_asc') sortOption = { budgetMin: 1 };
    else if (sortBy === 'proposals') sortOption = { proposalsCount: -1 };

    const totalCount = await Brief.countDocuments(filter);
    const briefs = await Brief.find(filter)
      .populate('clientId', 'name handle avatarUrl isVerified')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.json({
      projects: briefs,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to search project briefs' });
  }
}

export async function getProjectDiscoveryDetails(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Valid project ID is required' });
      return;
    }

    const brief = await Brief.findById(id).populate('clientId', 'name handle avatarUrl isVerified role');
    if (!brief) {
      res.status(404).json({ error: 'Project brief not found' });
      return;
    }

    res.json({ project: brief });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve project details' });
  }
}

export async function calculateBriefTalentMatch(req: Request, res: Response): Promise<void> {
  try {
    const { briefId, freelancerId } = req.query;
    if (!briefId || !freelancerId) {
      res.status(400).json({ error: 'Both briefId and freelancerId are required' });
      return;
    }

    const brief = await Brief.findById(briefId);
    if (!brief) {
      res.status(404).json({ error: 'Brief not found' });
      return;
    }

    const talent = await TalentProfile.findOne({
      $or: [{ _id: freelancerId }, { userId: freelancerId }],
    } as any).populate('userId', 'name handle avatarUrl isVerified');

    if (!talent) {
      res.status(404).json({ error: 'Freelancer profile not found' });
      return;
    }

    const matchResult = calculateCompatibility(brief, talent);
    res.json({ matchResult, brief, talent });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to calculate match compatibility' });
  }
}
