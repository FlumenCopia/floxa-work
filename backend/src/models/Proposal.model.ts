import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IProposedMilestone {
  title: string;
  description: string;
  deliverables?: string[];
  amount: number;
  deliveryDays: number;
  acceptanceCriteria?: string;
  revisionAssumptions?: string;
}

export interface IProposalSlider {
  key: string;
  label?: string;
  value: number; // 0 to 100
  rationale?: string;
}

export interface IProposalPortfolioItem {
  title: string;
  description: string;
  category?: string;
  role?: string;
  techOrSkills?: string[];
  outcome?: string;
  url?: string;
  relevanceExplanation?: string;
}

export interface IProposal {
  _id?: Types.ObjectId;
  id: string;
  briefId: Types.ObjectId | string;
  freelancerId: Types.ObjectId | string;
  
  // Section A: Problem Diagnosis
  diagnosticAnswers: {
    question: string;
    answer: string;
  }[];
  problemDiagnosis?: {
    understanding?: string;
    rootCauses?: string[];
    risksAndConstraints?: string[];
    clarifyingQuestions?: string[];
  };

  // Section B: Proposed Strategy
  proposedStrategy?: {
    strategicApproach?: string;
    solutionArchitecture?: string;
    expectedOutcomes?: string[];
    dependencies?: string[];
    alternativeApproaches?: string;
  };

  // Section C: Strategy Dimensions / Configuration
  strategicSliders: IProposalSlider[];

  // Section D: Milestone Breakdown
  proposedMilestones: IProposedMilestone[];

  // Section E: Pricing & Timeline
  totalPrice: number;
  currency?: string;
  pricingModel?: string;
  estimatedDays: number;
  assumptionsAndExclusions?: string;

  // Section F: Portfolio Proof
  portfolioItems?: IProposalPortfolioItem[];
  portfolioProofUrls: string[];

  // Section G: Freelancer Introduction
  freelancerIntro?: {
    coverNote?: string;
    relevantExperience?: string;
    availability?: string;
  };

  // Lifecycle Status
  status: 'draft' | 'pending' | 'shortlisted' | 'accepted' | 'declined' | 'withdrawn';
  clientFeedback?: string;
  shortlistedAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

const proposalMilestoneSchema = new Schema<IProposedMilestone>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    deliverables: { type: [String], default: [] },
    amount: { type: Number, required: true },
    deliveryDays: { type: Number, default: 7 },
    acceptanceCriteria: { type: String, default: '' },
    revisionAssumptions: { type: String, default: 'Up to 2 iterative refinement rounds included.' },
  },
  { _id: false }
);

const proposalSliderSchema = new Schema<IProposalSlider>(
  {
    key: { type: String, required: true },
    label: { type: String, default: '' },
    value: { type: Number, default: 50 },
    rationale: { type: String, default: '' },
  },
  { _id: false }
);

const proposalPortfolioItemSchema = new Schema<IProposalPortfolioItem>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    role: { type: String, default: 'Lead Consultant' },
    techOrSkills: { type: [String], default: [] },
    outcome: { type: String, default: '' },
    url: { type: String, default: '' },
    relevanceExplanation: { type: String, default: '' },
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
    problemDiagnosis: {
      understanding: { type: String, default: '' },
      rootCauses: { type: [String], default: [] },
      risksAndConstraints: { type: [String], default: [] },
      clarifyingQuestions: { type: [String], default: [] },
    },
    proposedStrategy: {
      strategicApproach: { type: String, default: '' },
      solutionArchitecture: { type: String, default: '' },
      expectedOutcomes: { type: [String], default: [] },
      dependencies: { type: [String], default: [] },
      alternativeApproaches: { type: String, default: '' },
    },
    strategicSliders: { type: [proposalSliderSchema], default: [] },
    proposedMilestones: { type: [proposalMilestoneSchema], default: [] },
    totalPrice: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    pricingModel: { type: String, default: 'fixed_milestone_direct' },
    estimatedDays: { type: Number, required: true },
    assumptionsAndExclusions: { type: String, default: '' },
    portfolioItems: { type: [proposalPortfolioItemSchema], default: [] },
    portfolioProofUrls: { type: [String], default: [] },
    freelancerIntro: {
      coverNote: { type: String, default: '' },
      relevantExperience: { type: String, default: '' },
      availability: { type: String, default: 'Available immediately (30-40 hrs/wk)' },
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'shortlisted', 'accepted', 'declined', 'withdrawn'],
      default: 'pending',
      index: true,
    },
    clientFeedback: { type: String, default: '' },
    shortlistedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    declinedAt: { type: Date, default: null },
  },
  {
    collection: 'proposals',
    timestamps: true,
  }
);

proposalSchema.index({ briefId: 1, freelancerId: 1 }, { unique: true });
proposalSchema.index({ briefId: 1, status: 1 });
proposalSchema.index({ createdAt: -1 });

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
