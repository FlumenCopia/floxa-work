import mongoose, { Schema, Model, Types } from 'mongoose';

export type DeliverableStatus =
  | 'draft'
  | 'in_progress'
  | 'submitted'
  | 'in_review'
  | 'revision_requested'
  | 'resubmitted'
  | 'approved'
  | 'completed';

export type MilestonePaymentStatus =
  | 'not_recorded'
  | 'reported_by_client'
  | 'acknowledged_by_freelancer'
  | 'disputed'
  | 'cancelled';

export interface IDeliverableSubmission {
  version?: number;
  title?: string;
  fileUrls: string[];
  notes: string;
  submittedBy?: Types.ObjectId | string;
  submittedAt: Date;
  reviewStatus?: 'pending' | 'revision_requested' | 'approved';
  reviewFeedback?: string;
  reviewedBy?: Types.ObjectId | string;
  reviewedAt?: Date;
}

export interface IRevisionRequest {
  feedback: string;
  requestedBy?: Types.ObjectId | string;
  requestedAt: Date;
  submissionVersion?: number;
}

export interface IMilestonePaymentDetails {
  paymentMethod?: string;
  reportedAt?: Date;
  externalReference?: string;
  receiptFileUrl?: string;
  acknowledgedAt?: Date;
  disputeReason?: string;
}

export interface IMilestone {
  _id?: Types.ObjectId;
  id: string;
  contractId: Types.ObjectId | string;
  milestoneNumber: number;
  title: string;
  description: string;
  amount: number;
  currency: string;
  deliverableStatus: DeliverableStatus;
  paymentStatus: MilestonePaymentStatus;
  paymentDetails?: IMilestonePaymentDetails;
  escrowState?: string; // Legacy fallback
  submissions: IDeliverableSubmission[];
  revisionRequests: IRevisionRequest[];
  reviewDeadline?: Date;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId | string;
  acceptanceCriteria?: string[];
  deliverableRequirements?: string[];
  paymentReportedAt?: Date;
  paymentAcknowledgedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const deliverableSubmissionSchema = new Schema<IDeliverableSubmission>(
  {
    version: { type: Number, default: 1 },
    title: { type: String, default: '' },
    fileUrls: { type: [String], default: [] },
    notes: { type: String, default: '' },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date, default: Date.now },
    reviewStatus: {
      type: String,
      enum: ['pending', 'revision_requested', 'approved'],
      default: 'pending',
    },
    reviewFeedback: { type: String, default: '' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date, default: null },
  },
  { _id: true }
);

const revisionRequestSchema = new Schema<IRevisionRequest>(
  {
    feedback: { type: String, required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    requestedAt: { type: Date, default: Date.now },
    submissionVersion: { type: Number, default: 1 },
  },
  { _id: true }
);

const milestoneSchema = new Schema<IMilestone>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    milestoneNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    deliverableStatus: {
      type: String,
      enum: [
        'draft',
        'in_progress',
        'submitted',
        'in_review',
        'revision_requested',
        'resubmitted',
        'approved',
        'completed',
      ],
      default: 'in_progress',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['not_recorded', 'reported_by_client', 'acknowledged_by_freelancer', 'disputed', 'cancelled'],
      default: 'not_recorded',
      index: true,
    },
    paymentDetails: {
      paymentMethod: { type: String, default: '' },
      reportedAt: { type: Date, default: null },
      externalReference: { type: String, default: '' },
      receiptFileUrl: { type: String, default: '' },
      acknowledgedAt: { type: Date, default: null },
      disputeReason: { type: String, default: '' },
    },
    escrowState: {
      type: String,
      default: 'awaiting_deposit',
    },
    submissions: { type: [deliverableSubmissionSchema], default: [] },
    revisionRequests: { type: [revisionRequestSchema], default: [] },
    reviewDeadline: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    acceptanceCriteria: { type: [String], default: [] },
    deliverableRequirements: { type: [String], default: [] },
    paymentReportedAt: { type: Date, default: null },
    paymentAcknowledgedAt: { type: Date, default: null },
  },
  {
    collection: 'milestones',
    timestamps: true,
  }
);

// Virtual backwards compatibility
milestoneSchema.virtual('status').get(function () {
  if (this.deliverableStatus === 'approved') return 'released';
  if (this.deliverableStatus === 'in_review') return 'in_review';
  return this.escrowState || 'in_progress';
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
