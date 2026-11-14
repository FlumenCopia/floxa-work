import { Request, Response } from 'express';
import crypto from 'crypto';
import { Brief } from '../models/Brief.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export async function createBrief(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const {
      title,
      category,
      problemStatement,
      description,
      targetAudience,
      deliverablesRequired,
      sliders,
      budgetMin,
      budgetMax,
      currency,
      deadlineWeeks,
      requiredSkills,
      industry,
    } = req.body;

    const finalProblemStatement = problemStatement || description;

    if (!title || !category || !finalProblemStatement || !budgetMin || !budgetMax) {
      res.status(400).json({ error: 'Missing required brief fields.' });
      return;
    }

    const magicLinkToken = crypto.randomBytes(24).toString('hex');

    const brief = await Brief.create({
      clientId: req.user.id,
      title,
      category,
      problemStatement: finalProblemStatement,
      targetAudience: targetAudience || '',
      deliverablesRequired: deliverablesRequired || [],
      requiredSkills: requiredSkills || [],
      industry: industry || '',
      sliders: sliders || [
        { key: 'speed_vs_craft', leftLabel: 'Speed / Launch Fast', rightLabel: 'High Craft / Pixel-Perfect', value: 50 },
        { key: 'risk_vs_safe', leftLabel: 'Proven / Industry Standard', rightLabel: 'Bold / Disruptive', value: 50 },
      ],
      budgetMin,
      budgetMax,
      currency: currency || 'USD',
      deadlineWeeks: deadlineWeeks || 2,
      magicLinkToken,
    });

    res.status(201).json({ brief });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create brief' });
  }
}

export async function getBriefsFeed(req: Request, res: Response): Promise<void> {
  try {
    const { category, minBudget, maxBudget, page = 1, limit = 20, clientId, allStatus } = req.query;
    const filter: Record<string, any> = {};

    if (!allStatus) {
      filter.status = { $in: ['open', 'in_review'] };
    }
    if (clientId) {
      filter.clientId = clientId;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (minBudget) {
      filter.budgetMax = { $gte: Number(minBudget) };
    }
    if (maxBudget) {
      filter.budgetMin = { $lte: Number(maxBudget) };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const briefs = await Brief.find(filter)
      .populate('clientId', 'name handle avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Brief.countDocuments(filter);

    res.json({
      briefs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch briefs' });
  }
}

export async function getBriefDetails(req: Request, res: Response): Promise<void> {
  try {
    const { idOrToken } = req.params;
    let brief = null;

    if (idOrToken.length === 48) {
      // Magic token
      brief = await Brief.findOne({ magicLinkToken: idOrToken }).populate('clientId', 'name handle avatarUrl');
    } else {
      brief = await Brief.findById(idOrToken).populate('clientId', 'name handle avatarUrl');
    }

    if (!brief) {
      res.status(404).json({ error: 'Brief not found' });
      return;
    }

    res.json({ brief });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch brief' });
  }
}

