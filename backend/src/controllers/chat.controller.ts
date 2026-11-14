import { Response } from 'express';
import { ChatMessage } from '../models/ChatMessage.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export async function getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const messages = await ChatMessage.find()
      .populate('senderId', 'name handle avatarUrl role')
      .sort({ createdAt: 1 })
      .limit(100);
    res.json({ messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch messages' });
  }
}

export async function sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { text, recipientId, briefId, contractId } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Message text is required' });
      return;
    }

    const message = await ChatMessage.create({
      senderId: req.user.id,
      recipientId: recipientId || req.user.id,
      briefId: briefId || null,
      contractId: contractId || null,
      text: text.trim(),
      type: 'text',
    });

    const populated = await ChatMessage.findById(message._id).populate('senderId', 'name handle avatarUrl role');

    res.status(201).json({ message: populated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
}

