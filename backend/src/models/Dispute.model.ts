import mongoose, { Schema, Model, Types } from 'mongoose';

export type DisputeCategory =
  | 'deliverable_quality'
  | 'scope_disagreement'
  | 'missed_deadlines'
  | 'communication_conduct'
  | 'payment_disagreement'
  | 'commitment_breach'
  | 'other';

export type DisputeStatus =
  | 'open'
  | 'awaiting_response'
  | 'under_review'
  | 'escalated'
  | 'resolved'
  | 'closed';

export interface IDisputeEvidence {
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  uploadedBy: Types.ObjectId | string;
  uploadedAt: Date;
}

export interface IDispute {
  _id?: Types.ObjectId;
  id: string;
  contractId: Types.ObjectId | string;
  briefId?: Types.ObjectId | string;
  initiatorId: Types.ObjectId | string;
  respondentId: Types.ObjectId | string;
  category: DisputeCategory;
  title: string;
  description: string;
  desiredOutcome?: string;
  status: DisputeStatus;
  evidenceFiles: IDisputeEvidence[];
  assignedModeratorId?: Types.ObjectId | string;
  moderatorNotes?: string;
  resolutionSummary?: string;
  resolutionAction?: string;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

const disputeEvidenceSchema = new Schema<IDisputeEvidence>(
  {
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const disputeSchema = new Schema<IDispute>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    briefId: { type: Schema.Types.ObjectId, ref: 'Brief', index: true, default: null },
    initiatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    respondentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      enum: [
        'deliverable_quality',
        'scope_disagreement',
        'missed_deadlines',
        'communication_conduct',
        'payment_disagreement',
        'commitment_breach',
        'other',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    desiredOutcome: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['open', 'awaiting_response', 'under_review', 'escalated', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    evidenceFiles: { type: [disputeEvidenceSchema], default: [] },
    assignedModeratorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    moderatorNotes: { type: String, default: '' },
    resolutionSummary: { type: String, default: '' },
    resolutionAction: { type: String, default: '' },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    collection: 'disputes',
    timestamps: true,
  }
);

disputeSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const Dispute: Model<IDispute> =
  mongoose.models.Dispute || mongoose.model<IDispute>('Dispute', disputeSchema);
