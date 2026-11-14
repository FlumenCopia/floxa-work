import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IChatMessage {
  _id?: Types.ObjectId;
  id: string;
  contractId?: Types.ObjectId | string;
  briefId?: Types.ObjectId | string;
  senderId: Types.ObjectId | string;
  recipientId: Types.ObjectId | string;
  text: string;
  attachments: string[];
  type: 'text' | 'file' | 'system' | 'call_log';
  callDurationSeconds?: number;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', default: null, index: true },
    briefId: { type: Schema.Types.ObjectId, ref: 'Brief', default: null, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, default: '', trim: true },
    attachments: { type: [String], default: [] },
    type: { type: String, enum: ['text', 'file', 'system', 'call_log'], default: 'text' },
    callDurationSeconds: { type: Number, default: 0 },
    readAt: { type: Date, default: null },
  },
  {
    collection: 'chat_messages',
    timestamps: true,
  }
);

chatMessageSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const ChatMessage: Model<IChatMessage> =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);

