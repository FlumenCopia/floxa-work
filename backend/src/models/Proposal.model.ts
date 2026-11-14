import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IProposedMilestone {
  title: string;
  description: string;
  amount: number;
  deliveryDays: number;
}

export interface IProposalSlider {
  key: string;
  value: number;
  rationale: string;
}

export interface IProposal {
  _id?: Types.ObjectId;
  id: string;
  briefId: Types.ObjectId | string;
  freelancerId: Types.ObjectId | string;
  diagnosticAnswers: {
    question: string;
    answer: string;
  }[];
  strategicSliders: IProposalSlider[];
  proposedMilestones: IProposedMilestone[];
  totalPrice: number;
  estimatedDays: number;
  portfolioProofUrls: string[];
  status: 'pending' | 'shortlisted' | 'accepted' | 'declined';
  clientFeedback?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const proposalMilestoneSchema = new Schema<IProposedMilestone>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    amount: { type: Number, required: true },
    deliveryDays: { type: Number, default: 7 },
  },
  { _id: false }
);

const proposalSliderSchema = new Schema<IProposalSlider>(
  {
    key: { type: String, required: true },
    value: { type: Number, default: 50 },
    rationale: { type: String, default: '' },
  },
  { _id: false }
);

const proposalSchema = new Schema<IProposal>(
  {
    briefId: { type: Schema.Types.ObjectId, ref: 'Brief', required: true, index: true },
    freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    diagnosticAnswers: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    strategicSliders: { type: [proposalSliderSchema], default: [] },
    proposedMilestones: { type: [proposalMilestoneSchema], default: [] },
    totalPrice: { type: Number, required: true },
    estimatedDays: { type: Number, required: true },
    portfolioProofUrls: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'accepted', 'declined'],
      default: 'pending',
      index: true,
    },
    clientFeedback: { type: String, default: '' },
  },
  {
    collection: 'proposals',
    timestamps: true,
  }
);

proposalSchema.index({ briefId: 1, freelancerId: 1 }, { unique: true });

proposalSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const Proposal: Model<IProposal> =
  mongoose.models.Proposal || mongoose.model<IProposal>('Proposal', proposalSchema);

