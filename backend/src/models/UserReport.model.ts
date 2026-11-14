import mongoose, { Schema, Model, Types } from 'mongoose';

export type ReportTargetType = 'user' | 'review' | 'contract' | 'message' | 'brief';
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export interface IUserReport {
  _id?: Types.ObjectId;
  id: string;
  reporterId: Types.ObjectId | string;
  targetUserId?: Types.ObjectId | string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
  evidenceUrls: string[];
  status: ReportStatus;
  adminNotes?: string;
  resolvedBy?: Types.ObjectId | string;
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const userReportSchema = new Schema<IUserReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    targetType: {
      type: String,
      enum: ['user', 'review', 'contract', 'message', 'brief'],
      required: true,
      index: true,
    },
    targetId: { type: String, required: true, index: true },
    reason: { type: String, required: true, trim: true },
    details: { type: String, default: '', trim: true },
    evidenceUrls: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    adminNotes: { type: String, default: '' },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  {
    collection: 'user_reports',
    timestamps: true,
  }
);

userReportSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const UserReport: Model<IUserReport> =
  mongoose.models.UserReport || mongoose.model<IUserReport>('UserReport', userReportSchema);
