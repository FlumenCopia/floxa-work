import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IBriefSlider {
  key: string;
  leftLabel: string;
  rightLabel: string;
  value: number; // 0 to 100
}

export interface IBrief {
  _id?: Types.ObjectId;
  id: string;
  clientId: Types.ObjectId | string;
  title: string;
  category: 'branding' | 'uiux' | 'webdev' | 'mobile' | 'marketing' | 'consulting';
  problemStatement: string;
  targetAudience: string;
  deliverablesRequired: string[];
  sliders: IBriefSlider[];
  budgetMin: number;
  budgetMax: number;
  currency: string;
  deadlineWeeks: number;
  status: 'draft' | 'open' | 'in_review' | 'assigned' | 'completed' | 'cancelled';
  proposalsCount: number;
  magicLinkToken: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const briefSliderSchema = new Schema<IBriefSlider>(
  {
    key: { type: String, required: true },
    leftLabel: { type: String, default: '' },
    rightLabel: { type: String, default: '' },
    value: { type: Number, default: 50 },
  },
  { _id: false }
);

const briefSchema = new Schema<IBrief>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['branding', 'uiux', 'webdev', 'mobile', 'marketing', 'consulting'],
      required: true,
      index: true,
    },
    problemStatement: { type: String, required: true, trim: true },
    targetAudience: { type: String, default: '', trim: true },
    deliverablesRequired: { type: [String], default: [] },
    sliders: { type: [briefSliderSchema], default: [] },
    budgetMin: { type: Number, required: true },
    budgetMax: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    deadlineWeeks: { type: Number, default: 2 },
    status: {
      type: String,
      enum: ['draft', 'open', 'in_review', 'assigned', 'completed', 'cancelled'],
      default: 'open',
      index: true,
    },
    proposalsCount: { type: Number, default: 0 },
    magicLinkToken: { type: String, default: '', index: true },
  },
  {
    collection: 'briefs',
    timestamps: true,
  }
);

briefSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const Brief: Model<IBrief> = mongoose.models.Brief || mongoose.model<IBrief>('Brief', briefSchema);

