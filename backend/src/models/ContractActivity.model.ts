import mongoose, { Schema, Model, Types } from 'mongoose';

export type ActivityAction =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_COMPLETED'
  | 'MILESTONE_STARTED'
  | 'DELIVERABLE_SUBMITTED'
  | 'REVISION_REQUESTED'
  | 'DELIVERABLE_APPROVED'
  | 'FILE_UPLOADED'
  | 'PAYMENT_REPORTED'
  | 'PAYMENT_ACKNOWLEDGED'
  | 'PAYMENT_DISPUTED'
  | 'CLOSEOUT_CONFIRMED'
  | 'PROJECT_COMPLETED';

export interface IContractActivity {
  _id?: Types.ObjectId;
  id: string;
  contractId: Types.ObjectId | string;
  actorId: Types.ObjectId | string;
  action: ActivityAction;
  title: string;
  details: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

const contractActivitySchema = new Schema<IContractActivity>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
      type: String,
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    details: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  {
    collection: 'contract_activities',
    timestamps: true,
  }
);

contractActivitySchema.index({ contractId: 1, createdAt: -1 });

contractActivitySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const ContractActivity: Model<IContractActivity> =
  mongoose.models.ContractActivity ||
  mongoose.model<IContractActivity>('ContractActivity', contractActivitySchema);
