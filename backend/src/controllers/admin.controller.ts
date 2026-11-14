import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { User } from '../models/User.model.js';
import { Brief } from '../models/Brief.model.js';
import { Contract } from '../models/Contract.model.js';
import { Milestone } from '../models/Milestone.model.js';

export async function getAdminPlatformStats(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const totalUsers = await User.countDocuments();
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalFreelancers = await User.countDocuments({ role: 'freelancer' });
    const totalBriefs = await Brief.countDocuments();
    const openBriefs = await Brief.countDocuments({ status: 'open' });
    const totalContracts = await Contract.countDocuments();
    const activeContracts = await Contract.countDocuments({ status: 'active' });
    const completedContracts = await Contract.countDocuments({ status: 'completed' });

    // Aggregate total direct milestone volume
    const volumeAgg = await Milestone.aggregate([
      {
        $match: {
          $or: [
            { paymentStatus: 'acknowledged_by_freelancer' },
            { deliverableStatus: 'approved' },
            { escrowState: 'released' },
          ],
        },
      },
      { $group: { _id: null, totalReleased: { $sum: '$amount' } } },
    ]);
    const totalVolume = volumeAgg.length > 0 ? volumeAgg[0].totalReleased : 0;

    res.json({
      stats: {
        totalUsers,
        totalClients,
        totalFreelancers,
        totalBriefs,
        openBriefs,
        totalContracts,
        activeContracts,
        completedContracts,
        totalVolume,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch admin stats' });
  }
}

export async function getAdminUsers(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { handle: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
}

export async function toggleUserVerification(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.isVerified = !user.isVerified;
    await user.save();

    res.json({
      message: `User verification updated to ${user.isVerified}`,
      isVerified: user.isVerified,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update user verification' });
  }
}
