import { Response } from 'express';
import mongoose from 'mongoose';
import { Invitation } from '../models/Invitation.model.js';
import { Brief } from '../models/Brief.model.js';
import { User } from '../models/User.model.js';
import { AuditLog } from '../models/AuditLog.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { broadcastSystemNotification } from '../websocket/socketServer.js';

export async function sendInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const { briefId, freelancerId, message } = req.body;
    if (!briefId || !freelancerId) {
      res.status(400).json({ error: 'Both briefId and freelancerId are required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(briefId) || !mongoose.Types.ObjectId.isValid(freelancerId)) {
      res.status(400).json({ error: 'Invalid briefId or freelancerId' });
      return;
    }

    const brief = await Brief.findById(briefId);
    if (!brief) {
      res.status(404).json({ error: 'Discovery brief not found' });
      return;
    }

    // STRICT PERMISSION: Client must own the brief to send invitations!
    if (brief.clientId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: You can only invite talent to your own discovery briefs.' });
      return;
    }

    // Verify freelancer exists
    const freelancer = await User.findById(freelancerId);
    if (!freelancer) {
      res.status(404).json({ error: 'Target freelancer not found' });
      return;
    }

    // Check for existing active invitation
    const existing = await Invitation.findOne({
      briefId,
      freelancerId,
      status: { $in: ['pending', 'accepted'] },
    });
    if (existing) {
      res.status(409).json({ error: 'An active invitation has already been sent to this freelancer for this brief.' });
      return;
    }

    const invitation = await Invitation.create({
      briefId,
      clientId: req.user.id,
      freelancerId,
      message: message || 'We reviewed your portfolio and would like to invite you to submit a diagnostic pitch for our project.',
      status: 'pending',
    });

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    await AuditLog.create({
      actorId: req.user.id,
      action: 'INVITATION_SENT',
      targetType: 'Invitation',
      targetId: invitation.id,
      ipAddress,
      metadata: { briefId: brief.id, freelancerId: freelancer.id },
    });

    broadcastSystemNotification({
      title: 'Project Invitation Received',
      message: `${req.user.name || 'Client'} invited you to submit a Mini-Discovery pitch for "${brief.title}"!`,
      senderName: req.user.name || 'Client',
      type: 'invitation',
      tab: 'mini-discovery',
    });

    res.status(201).json({ message: 'Invitation sent successfully', invitation });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send invitation' });
  }
}

export async function getInvitations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { type = 'received' } = req.query;

    let query: Record<string, any> = {};
    if (type === 'sent') {
      query = { clientId: req.user.id };
    } else {
      query = { freelancerId: req.user.id };
    }

    const invitations = await Invitation.find(query)
      .populate('briefId', 'title category budgetMin budgetMax status')
      .populate('clientId', 'name handle avatarUrl isVerified')
      .populate('freelancerId', 'name handle avatarUrl isVerified')
      .sort({ createdAt: -1 });

    res.json({ invitations, count: invitations.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve invitations' });
  }
}

export async function acceptInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const invitation = await Invitation.findById(id);
    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    if (invitation.freelancerId.toString() !== req.user.id.toString()) {
      res.status(403).json({ error: 'Only the invited freelancer can accept this invitation.' });
      return;
    }

    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    await invitation.save();

    broadcastSystemNotification({
      title: 'Invitation Accepted',
      message: `${req.user.name || 'Freelancer'} accepted your invitation to submit a pitch!`,
      senderName: req.user.name || 'Freelancer',
      type: 'invitation',
    });

    res.json({ message: 'Invitation accepted. You can now submit your Mini-Discovery pitch.', invitation });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to accept invitation' });
  }
}

export async function declineInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const invitation = await Invitation.findById(id);
    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    if (invitation.freelancerId.toString() !== req.user.id.toString()) {
      res.status(403).json({ error: 'Only the invited freelancer can decline this invitation.' });
      return;
    }

    invitation.status = 'declined';
    invitation.respondedAt = new Date();
    await invitation.save();

    res.json({ message: 'Invitation declined', invitation });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to decline invitation' });
  }
}

export async function cancelInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const invitation = await Invitation.findById(id);
    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    if (invitation.clientId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Only the inviting client can cancel this invitation.' });
      return;
    }

    invitation.status = 'cancelled';
    await invitation.save();

    res.json({ message: 'Invitation cancelled', invitation });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to cancel invitation' });
  }
}
