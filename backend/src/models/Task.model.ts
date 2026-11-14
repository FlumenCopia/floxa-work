import mongoose, { Schema, Model, Types } from 'mongoose';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITaskComment {
  id?: string;
  userId: Types.ObjectId | string;
  userName?: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

export interface ITask {
  _id?: Types.ObjectId;
  id: string;
  contractId: Types.ObjectId | string;
  milestoneId?: Types.ObjectId | string | null;
  title: string;
  description: string;
  assignedTo?: Types.ObjectId | string | null;
  createdBy: Types.ObjectId | string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: Date | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  comments: ITaskComment[];
  attachments: string[];
  isArchived: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const taskCommentSchema = new Schema<ITaskComment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, default: '' },
    userAvatar: { type: String, default: '' },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const taskSchema = new Schema<ITask>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    milestoneId: { type: Schema.Types.ObjectId, ref: 'Milestone', default: null, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'in_review', 'blocked', 'completed'],
      default: 'todo',
      index: true,
    },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null },
    comments: { type: [taskCommentSchema], default: [] },
    attachments: { type: [String], default: [] },
    isArchived: { type: Boolean, default: false, index: true },
  },
  {
    collection: 'tasks',
    timestamps: true,
  }
);

// Compound indexes for rapid filtering and sorting in project workspace
taskSchema.index({ contractId: 1, status: 1, dueDate: 1 });
taskSchema.index({ contractId: 1, milestoneId: 1 });
taskSchema.index({ contractId: 1, assignedTo: 1 });

taskSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);
