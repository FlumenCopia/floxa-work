import mongoose, { Schema, Model, Types } from 'mongoose';

export type EscrowState = 'awaiting_deposit' | 'held_in_escrow' | 'in_review' | 'released' | 'disputed' | 'refunded';

export interface IDeliverableSubmission {
  fileUrls: string[];
  notes: string;
  submittedAt: Date;
}

export interface IMilestone {
  _id?: Types.ObjectId;
  id: string;
  contractId: Types.ObjectId | string;
  milestoneNumber: number;
  title: string;
  description: string;
  amount: number;
  escrowState: EscrowState;
  paymentGatewayRef?: string;
  submissions: IDeliverableSubmission[];
  revisionRequests: {
    feedback: string;
    requestedAt: Date;
  }[];
  reviewDeadline?: Date;
  approvedAt?: Date;
  releasedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const deliverableSubmissionSchema = new Schema<IDeliverableSubmission>(
  {
    fileUrls: { type: [String], default: [] },
    notes: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const milestoneSchema = new Schema<IMilestone>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    milestoneNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    amount: { type: Number, required: true },
    escrowState: {
      type: String,
      enum: ['awaiting_deposit', 'held_in_escrow', 'in_review', 'released', 'disputed', 'refunded'],
      default: 'awaiting_deposit',
      index: true,
    },
    paymentGatewayRef: { type: String, default: '' },
    submissions: { type: [deliverableSubmissionSchema], default: [] },
    revisionRequests: [
      {
        feedback: { type: String, required: true },
        requestedAt: { type: Date, default: Date.now },
      },
    ],
    reviewDeadline: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
  },
  {
    collection: 'milestones',
    timestamps: true,
  }
);

milestoneSchema.virtual('status').get(function () {
  return this.escrowState;
});

milestoneSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const Milestone: Model<IMilestone> =
  mongoose.models.Milestone || mongoose.model<IMilestone>('Milestone', milestoneSchema);

