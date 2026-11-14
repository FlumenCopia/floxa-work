import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IUserBlock {
  _id?: Types.ObjectId;
  id: string;
  blockerId: Types.ObjectId | string;
  blockedId: Types.ObjectId | string;
  reason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const userBlockSchema = new Schema<IUserBlock>(
  {
    blockerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    blockedId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, default: '', trim: true },
  },
  {
    collection: 'user_blocks',
    timestamps: true,
  }
);

// Prevent duplicate blocks
userBlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

userBlockSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const UserBlock: Model<IUserBlock> =
  mongoose.models.UserBlock || mongoose.model<IUserBlock>('UserBlock', userBlockSchema);
