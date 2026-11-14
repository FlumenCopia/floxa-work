import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IDisputeMessage {
  _id?: Types.ObjectId;
  id: string;
  disputeId: Types.ObjectId | string;
  senderId: Types.ObjectId | string;
  senderRole?: 'initiator' | 'respondent' | 'moderator' | 'admin';
  text: string;
  attachments?: string[];
  isInternalModeratorNote: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const disputeMessageSchema = new Schema<IDisputeMessage>(
  {
    disputeId: { type: Schema.Types.ObjectId, ref: 'Dispute', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderRole: {
      type: String,
      enum: ['initiator', 'respondent', 'moderator', 'admin'],
      default: 'initiator',
    },
    text: { type: String, required: true, trim: true },
    attachments: { type: [String], default: [] },
    isInternalModeratorNote: { type: Boolean, default: false, index: true },
  },
  {
    collection: 'dispute_messages',
    timestamps: true,
  }
);

disputeMessageSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const DisputeMessage: Model<IDisputeMessage> =
  mongoose.models.DisputeMessage ||
  mongoose.model<IDisputeMessage>('DisputeMessage', disputeMessageSchema);
