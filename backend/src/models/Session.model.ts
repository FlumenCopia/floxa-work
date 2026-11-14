import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ISession {
  _id?: Types.ObjectId;
  id: string;
  userId: Types.ObjectId | string;
  familyId: string;
  refreshTokenHash: string;
  userAgent: string;
  ipAddress: string;
  isRevoked: boolean;
  expiresAt: Date;
  lastActiveAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: String, required: true, index: true },
    refreshTokenHash: { type: String, required: true, index: true },
    userAgent: { type: String, default: 'Unknown' },
    ipAddress: { type: String, default: '127.0.0.1' },
    isRevoked: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index auto-deletes expired sessions
    lastActiveAt: { type: Date, default: Date.now },
  },
  {
    collection: 'sessions',
    timestamps: true,
  }
);

sessionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.refreshTokenHash;
    delete ret.__v;
    return ret;
  },
});

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', sessionSchema);
