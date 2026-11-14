import { Response } from 'express';
import mongoose from 'mongoose';
import { Contract } from '../models/Contract.model.js';
import { Milestone } from '../models/Milestone.model.js';
import { Task, ITask, TaskStatus, TaskPriority } from '../models/Task.model.js';
import { ContractActivity, ActivityAction } from '../models/ContractActivity.model.js';
import { Notification } from '../models/Notification.model.js';
import { ChatMessage } from '../models/ChatMessage.model.js';
import { PaymentRecord } from '../models/PaymentRecord.model.js';
import { FileRecord } from '../models/File.model.js';
import { User } from '../models/User.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { broadcastSystemNotification } from '../websocket/socketServer.js';

/**
 * Helper to verify user is client, freelancer, or admin of a contract
 */
export async function verifyContractParticipant(
  contractId: string,
  userId: string,
  userRole?: string
): Promise<{ isAuthorized: boolean; contract: any | null; role: 'client' | 'freelancer' | 'admin' | null }> {
  if (!mongoose.Types.ObjectId.isValid(contractId)) {
    return { isAuthorized: false, contract: null, role: null };
  }

  const contract = await Contract.findById(contractId)
    .populate('briefId', 'title category problemStatement budgetMin budgetMax requiredSkills deliverablesRequired')
    .populate('clientId', 'name handle avatarUrl email isVerified')
    .populate('freelancerId', 'name handle avatarUrl email isVerified');

  if (!contract) {
    return { isAuthorized: false, contract: null, role: null };
  }

  const isClient =
    contract.clientId &&
    ((contract.clientId as any)._id || contract.clientId).toString() === userId.toString();
  const isFreelancer =
    contract.freelancerId &&
    ((contract.freelancerId as any)._id || contract.freelancerId).toString() === userId.toString();
  const isAdmin = userRole === 'admin';

  if (!isClient && !isFreelancer && !isAdmin) {
    return { isAuthorized: false, contract, role: null };
  }

  const role = isClient ? 'client' : isFreelancer ? 'freelancer' : 'admin';
  return { isAuthorized: true, contract, role };
}

/**
 * 1. GET /api/contracts/:contractId/workspace
 * Complete authoritative project collaboration workspace data
 */
export async function getWorkspaceDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const { contractId } = req.params;
    const { isAuthorized, contract, role } = await verifyContractParticipant(
      contractId,
      req.user.id,
      req.user.role
    );

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    if (!isAuthorized) {
      res.status(403).json({ error: 'Access denied: You are not an authorized participant in this project workspace.' });
      return;
    }

    // Parallel fetch of workspace components
    const [milestones, tasks, paymentRecords, activities, fileRecords] = await Promise.all([
      Milestone.find({ contractId: contract._id }).sort({ milestoneNumber: 1 }),
      Task.find({ contractId: contract._id, isArchived: false })
        .populate('assignedTo', 'name handle avatarUrl')
        .populate('createdBy', 'name handle')
        .sort({ dueDate: 1, createdAt: -1 }),
      PaymentRecord.find({ contractId: contract._id }).sort({ createdAt: -1 }),
      ContractActivity.find({ contractId: contract._id })
        .populate('actorId', 'name handle avatarUrl')
        .sort({ createdAt: -1 })
        .limit(50),
      FileRecord.find({
        $or: [
          { ownerId: { $in: [contract.clientId._id || contract.clientId, contract.freelancerId._id || contract.freelancerId] } },
        ],
      }).sort({ createdAt: -1 }).limit(50),
    ]);

    // Task stats
    const taskStats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      in_review: tasks.filter((t) => t.status === 'in_review').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      blocked: tasks.filter((t) => t.status === 'blocked').length,
      overdue: tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
    };

    // Closeout checklist calculation
    const allMilestonesApproved = milestones.length > 0 && milestones.every((m) => m.deliverableStatus === 'approved');
    const hasUnresolvedRevisions = milestones.some((m) => m.deliverableStatus === 'revision_requested');
    const isCloseoutReady = allMilestonesApproved && !hasUnresolvedRevisions;

    res.json({
      workspace: {
        contract,
        authoritativeScope: contract.proposalSnapshot || null,
        userRole: role,
        milestones,
        tasks,
        taskStats,
        paymentRecords,
        activities,
        closeoutChecklist: {
          allMilestonesReviewed: milestones.length > 0,
          allMilestonesApproved,
          hasUnresolvedRevisions,
          isCloseoutReady,
          clientCloseoutConfirmed: Boolean(contract.clientCloseoutConfirmed),
          clientCloseoutConfirmedAt: contract.clientCloseoutConfirmedAt || null,
          freelancerCloseoutConfirmed: Boolean(contract.freelancerCloseoutConfirmed),
          freelancerCloseoutConfirmedAt: contract.freelancerCloseoutConfirmedAt || null,
          closeoutStatus: contract.closeoutStatus || 'open',
          isFullyClosed: contract.status === 'completed' && Boolean(contract.clientCloseoutConfirmed && contract.freelancerCloseoutConfirmed),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch project workspace' });
  }
}

/**
 * 2. GET /api/contracts/:contractId/tasks
 * Filter and sort tasks for a contract
 */
export async function getContractTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { contractId } = req.params;
    const { isAuthorized } = await verifyContractParticipant(contractId, req.user.id, req.user.role);

    if (!isAuthorized) {
      res.status(403).json({ error: 'Access denied: You do not participate in this project contract.' });
      return;
    }

    const { status, milestoneId, assignedTo, priority, search } = req.query;
    const filter: Record<string, any> = { contractId, isArchived: false };

    if (status && typeof status === 'string' && status !== 'all') {
      filter.status = status;
    }
    if (milestoneId && mongoose.Types.ObjectId.isValid(milestoneId as string)) {
      filter.milestoneId = milestoneId;
    }
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo as string)) {
      filter.assignedTo = assignedTo;
    }
    if (priority && typeof priority === 'string' && priority !== 'all') {
      filter.priority = priority;
    }
    if (search && typeof search === 'string') {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name handle avatarUrl')
      .populate('createdBy', 'name handle')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json({ tasks });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch tasks' });
  }
}

/**
 * 3. POST /api/contracts/:contractId/tasks
 * Create a new task within a contract
 */
export async function createContractTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { contractId } = req.params;
    const { isAuthorized, contract } = await verifyContractParticipant(contractId, req.user.id, req.user.role);

    if (!isAuthorized || !contract) {
      res.status(403).json({ error: 'Access denied: You cannot create tasks for this contract.' });
      return;
    }

    const { title, description, milestoneId, assignedTo, priority, startDate, dueDate, attachments } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Task title is required' });
      return;
    }

    // Validate milestone belongs to contract if provided
    if (milestoneId) {
      const validMilestone = await Milestone.findOne({ _id: milestoneId, contractId: contract._id });
      if (!validMilestone) {
        res.status(400).json({ error: 'Specified milestone does not belong to this contract' });
        return;
      }
    }

    // Validate assignee belongs to contract participants
    let validAssignee: string | null = null;
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
      const clientUserId = (contract.clientId._id || contract.clientId).toString();
      const freelancerUserId = (contract.freelancerId._id || contract.freelancerId).toString();
      if (assignedTo.toString() === clientUserId || assignedTo.toString() === freelancerUserId) {
        validAssignee = assignedTo;
      }
    }

    const task = await Task.create({
      contractId: contract._id,
      milestoneId: milestoneId || null,
      title: title.trim(),
      description: (description || '').trim(),
      assignedTo: validAssignee,
      createdBy: req.user.id,
      priority: priority && ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
      status: 'todo',
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name handle avatarUrl')
      .populate('createdBy', 'name handle');

    // Record activity
    await ContractActivity.create({
      contractId: contract._id,
      actorId: req.user.id,
      action: 'TASK_CREATED',
      title: `Task Created: ${task.title}`,
      details: `${req.user.name || 'Participant'} created a new task in the workspace.`,
      metadata: { taskId: task._id, priority: task.priority },
    });

    // Notify assignee if someone else assigned it
    if (validAssignee && validAssignee.toString() !== req.user.id.toString()) {
      await Notification.create({
        userId: validAssignee,
        senderId: req.user.id,
        contractId: contract._id,
        type: 'task',
        title: 'New Task Assigned',
        message: `${req.user.name || 'A team member'} assigned you to task: "${task.title}".`,
        linkUrl: `/workspace?contractId=${contract._id}&taskId=${task._id}`,
      });
    }

    res.status(201).json({ message: 'Task created successfully', task: populatedTask });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
}

/**
 * 4. PATCH /api/tasks/:taskId
 * Update task status, fields, or archive
 */
export async function updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { taskId } = req.params;
    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      res.status(400).json({ error: 'Valid taskId is required' });
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const { isAuthorized, contract } = await verifyContractParticipant(
      task.contractId.toString(),
      req.user.id,
      req.user.role
    );

    if (!isAuthorized) {
      res.status(403).json({ error: 'Access denied: You cannot modify tasks in this contract.' });
      return;
    }

    const { title, description, status, priority, dueDate, assignedTo, isArchived } = req.body;

    const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'blocked', 'completed'];
    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: `Invalid task status. Allowed: ${validStatuses.join(', ')}` });
        return;
      }
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date();
      } else {
        task.completedAt = null;
      }
    }

    if (title && title.trim()) task.title = title.trim();
    if (description !== undefined) task.description = String(description).trim();
    if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (assignedTo !== undefined) {
      if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
        task.assignedTo = assignedTo;
      } else {
        task.assignedTo = null;
      }
    }
    if (typeof isArchived === 'boolean') task.isArchived = isArchived;

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name handle avatarUrl')
      .populate('createdBy', 'name handle');

    // Record activity
    const action: ActivityAction = task.status === 'completed' ? 'TASK_COMPLETED' : 'TASK_UPDATED';
    await ContractActivity.create({
      contractId: task.contractId,
      actorId: req.user.id,
      action,
      title: task.status === 'completed' ? `Task Completed: ${task.title}` : `Task Updated: ${task.title}`,
      details: `${req.user.name || 'Participant'} updated task status to "${task.status}".`,
      metadata: { taskId: task._id, status: task.status },
    });

    res.json({ message: 'Task updated successfully', task: populatedTask });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update task' });
  }
}

/**
 * 5. POST /api/tasks/:taskId/comments
 * Add comment to task
 */
export async function addTaskComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { taskId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Comment text is required' });
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const { isAuthorized } = await verifyContractParticipant(
      task.contractId.toString(),
      req.user.id,
      req.user.role
    );

    if (!isAuthorized) {
      res.status(403).json({ error: 'Access denied: You cannot comment on tasks in this contract.' });
      return;
    }

    task.comments.push({
      userId: req.user.id,
      userName: req.user.name || 'Participant',
      userAvatar: (req.user as any).avatarUrl || '',
      text: text.trim(),
      createdAt: new Date(),
    });

    await task.save();
    res.status(201).json({ message: 'Comment added', task });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to add comment' });
  }
}

/**
 * 6. GET /api/contracts/:contractId/activity
 * Project activity timeline with pagination
 */
export async function getContractActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { contractId } = req.params;
    const { isAuthorized } = await verifyContractParticipant(contractId, req.user.id, req.user.role);

    if (!isAuthorized) {
      res.status(403).json({ error: 'Access denied: You cannot view activity for this contract.' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const total = await ContractActivity.countDocuments({ contractId });
    const activities = await ContractActivity.find({ contractId })
      .populate('actorId', 'name handle avatarUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      activities,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch contract activity' });
  }
}

/**
 * 7. GET /api/contracts/:contractId/files
 * Aggregated files repository for this workspace
 */
export async function getContractFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { contractId } = req.params;
    const { isAuthorized, contract } = await verifyContractParticipant(contractId, req.user.id, req.user.role);

    if (!isAuthorized || !contract) {
      res.status(403).json({ error: 'Access denied: You cannot access files for this contract.' });
      return;
    }

    // Extract file references from milestone submissions & payments & tasks
    const [milestones, payments, tasks] = await Promise.all([
      Milestone.find({ contractId: contract._id }),
      PaymentRecord.find({ contractId: contract._id }),
      Task.find({ contractId: contract._id }),
    ]);

    const fileReferences: Array<{
      filename: string;
      originalName?: string;
      source: 'milestone_deliverable' | 'payment_receipt' | 'task_attachment';
      milestoneNumber?: number;
      taskTitle?: string;
      uploadedAt?: Date;
    }> = [];

    milestones.forEach((m) => {
      (m.submissions || []).forEach((s) => {
        (s.fileUrls || []).forEach((f) => {
          fileReferences.push({
            filename: f,
            source: 'milestone_deliverable',
            milestoneNumber: m.milestoneNumber,
            uploadedAt: s.submittedAt,
          });
        });
      });
    });

    payments.forEach((p) => {
      if (p.receiptFileUrl) {
        fileReferences.push({
          filename: p.receiptFileUrl,
          source: 'payment_receipt',
          uploadedAt: p.reportedDate || p.createdAt,
        });
      }
    });

    tasks.forEach((t) => {
      (t.attachments || []).forEach((a) => {
        fileReferences.push({
          filename: a,
          source: 'task_attachment',
          taskTitle: t.title,
          uploadedAt: t.createdAt,
        });
      });
    });

    res.json({ files: fileReferences, contractId });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch contract files' });
  }
}

/**
 * 8. POST /api/contracts/:contractId/closeout
 * Dual-party closeout confirmation (Client & Freelancer)
 */
export async function confirmCloseout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { contractId } = req.params;
    const { isAuthorized, contract, role } = await verifyContractParticipant(
      contractId,
      req.user.id,
      req.user.role
    );

    if (!isAuthorized || !contract) {
      res.status(403).json({ error: 'Access denied: You cannot confirm closeout for this contract.' });
      return;
    }

    const { notes } = req.body;
    const now = new Date();

    if (role === 'client') {
      contract.clientCloseoutConfirmed = true;
      contract.clientCloseoutConfirmedAt = now;
      contract.clientCloseoutNotes = notes || 'Client confirmed all deliverables approved and handover received.';
    } else if (role === 'freelancer') {
      contract.freelancerCloseoutConfirmed = true;
      contract.freelancerCloseoutConfirmedAt = now;
      contract.freelancerCloseoutNotes = notes || 'Freelancer confirmed project completion and handover.';
    } else if (role === 'admin') {
      // Admin can confirm on behalf if mediation required
      contract.clientCloseoutConfirmed = true;
      contract.clientCloseoutConfirmedAt = now;
      contract.freelancerCloseoutConfirmed = true;
      contract.freelancerCloseoutConfirmedAt = now;
    }

    // Check if both parties have confirmed
    const bothConfirmed = Boolean(contract.clientCloseoutConfirmed && contract.freelancerCloseoutConfirmed);
    if (bothConfirmed) {
      contract.status = 'completed';
      contract.closeoutStatus = 'completed';
      contract.actualCompletionDate = now;

      await ContractActivity.create({
        contractId: contract._id,
        actorId: req.user.id,
        action: 'PROJECT_COMPLETED',
        title: 'Project Closed & Completed',
        details: 'Both client and freelancer confirmed project handover and closeout.',
        metadata: { completionDate: now },
      });

      broadcastSystemNotification({
        title: 'Project Successfully Completed',
        message: `Project "${contract.briefId?.title || 'Agreement'}" has been formally closed with dual-party handover confirmation!`,
        senderName: req.user.name || 'System',
        type: 'closeout',
        tab: 'workspace',
      });
    } else {
      contract.closeoutStatus = 'in_review';

      await ContractActivity.create({
        contractId: contract._id,
        actorId: req.user.id,
        action: 'CLOSEOUT_CONFIRMED',
        title: `Closeout Confirmed by ${role === 'client' ? 'Client' : 'Freelancer'}`,
        details: `${req.user.name || 'Participant'} confirmed project handover checklist.`,
        metadata: { role, confirmedAt: now },
      });
    }

    await contract.save();

    res.json({
      message: bothConfirmed
        ? 'Project successfully completed and closed with dual-party confirmation.'
        : 'Your closeout confirmation has been recorded. Awaiting counterpart confirmation.',
      contract,
      isFullyClosed: bothConfirmed,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to confirm closeout' });
  }
}

/**
 * 9. GET /api/contracts/:contractId/messages & POST /api/contracts/:contractId/messages
 * Contract-scoped discussions
 */
export async function getContractMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { contractId } = req.params;
    const { isAuthorized } = await verifyContractParticipant(contractId, req.user.id, req.user.role);

    if (!isAuthorized) {
      res.status(403).json({ error: 'Access denied: You do not participate in this project contract.' });
      return;
    }

    const messages = await ChatMessage.find({ contractId })
      .populate('senderId', 'name handle avatarUrl role')
      .sort({ createdAt: 1 })
      .limit(200);

    res.json({ messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch contract messages' });
  }
}

export async function sendContractMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { contractId } = req.params;
    const { isAuthorized, contract } = await verifyContractParticipant(contractId, req.user.id, req.user.role);

    if (!isAuthorized || !contract) {
      res.status(403).json({ error: 'Access denied: You cannot post in this project contract.' });
      return;
    }

    const { text, attachments } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Message text is required' });
      return;
    }

    const recipientId = (contract.clientId._id || contract.clientId).toString() === req.user.id.toString()
      ? contract.freelancerId._id || contract.freelancerId
      : contract.clientId._id || contract.clientId;

    const message = await ChatMessage.create({
      contractId: contract._id,
      senderId: req.user.id,
      recipientId,
      text: text.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      type: 'text',
    });

    const populated = await ChatMessage.findById(message._id).populate('senderId', 'name handle avatarUrl role');

    res.status(201).json({ message: populated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send contract message' });
  }
}

/**
 * 10. Notifications Endpoints
 */
export async function getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const notifications = await Notification.find({ userId: req.user.id })
      .populate('senderId', 'name handle avatarUrl')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });

    res.json({ notifications, unreadCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
}

export async function markNotificationRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json({ message: 'Marked as read', notification });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to mark notification read' });
  }
}

export async function markAllNotificationsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to mark all notifications read' });
  }
}
