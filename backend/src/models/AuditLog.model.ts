import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IAuditLog {
  _id?: Types.ObjectId;
  id: string;
  actorId?: Types.ObjectId | string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true, default: null },
    action: { type: String, required: true, index: true },
    targetType: { type: String, default: null, index: true },
    targetId: { type: String, default: null, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: 'Unknown' },
  },
  {
    collection: 'audit_logs',
    timestamps: { createdAt: true, updatedAt: false }, // Immutable audit log
  }
);

auditLogSchema.index({ createdAt: -1 });

auditLogSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
