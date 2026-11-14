import mongoose, { Schema, Model, Types } from 'mongoose';

export type NotificationType =
  | 'task'
  | 'deliverable'
  | 'milestone'
  | 'revision'
  | 'closeout'
  | 'payment'
  | 'chat'
  | 'info';

export interface INotification {
  _id?: Types.ObjectId;
  id: string;
  userId: Types.ObjectId | string;
  senderId?: Types.ObjectId | string | null;
  contractId?: Types.ObjectId | string | null;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  read: boolean;
  readAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', default: null, index: true },
    type: {
      type: String,
      enum: ['task', 'deliverable', 'milestone', 'revision', 'closeout', 'payment', 'chat', 'info'],
      default: 'info',
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    linkUrl: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  {
    collection: 'notifications',
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

notificationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
