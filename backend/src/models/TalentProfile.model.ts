import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ITalentPortfolioItem {
  title: string;
  description: string;
  category?: string;
  role?: string;
  techOrSkills?: string[];
  url?: string;
  outcome?: string;
}

export interface ITalentProfile {
  _id?: Types.ObjectId;
  id: string;
  userId: Types.ObjectId | string;
  headline: string;
  bio: string;
  skills: string[];
  primaryCategory?: string;
  specializations?: string[];
  industries?: string[];
  yearsOfExperience?: number;
  location?: string;
  hourlyRate: number;
  minimumProjectBudget: number;
  availabilityStatus: 'available' | 'busy' | 'not_looking';
  availableSpotsThisMonth: number;
  portfolioLinks: { title: string; url: string; platform: string }[];
  portfolioItems?: ITalentPortfolioItem[];
  completedContractsCount: number;
  escrowVolumeEarned: number;
  ratingAverage: number;
  ratingCount: number;
  communicationScore?: number;
  qualityScore?: number;
  reliabilityScore?: number;
  professionalismScore?: number;
  ratingBreakdown?: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const talentPortfolioItemSchema = new Schema<ITalentPortfolioItem>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    role: { type: String, default: 'Lead Specialist' },
    techOrSkills: { type: [String], default: [] },
    url: { type: String, default: '' },
    outcome: { type: String, default: '' },
  },
  { _id: false }
);

const talentProfileSchema = new Schema<ITalentProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    headline: { type: String, default: '', trim: true },
    bio: { type: String, default: '', trim: true },
    skills: { type: [String], default: [], index: true },
    primaryCategory: { type: String, default: 'branding', index: true },
    specializations: { type: [String], default: [] },
    industries: { type: [String], default: [] },
    yearsOfExperience: { type: Number, default: 5 },
    location: { type: String, default: 'Remote' },
    hourlyRate: { type: Number, default: 0, index: true },
    minimumProjectBudget: { type: Number, default: 500 },
    availabilityStatus: {
      type: String,
      enum: ['available', 'busy', 'not_looking'],
      default: 'available',
      index: true,
    },
    availableSpotsThisMonth: { type: Number, default: 2 },
    portfolioLinks: [
      {
        title: { type: String, default: '' },
        url: { type: String, default: '' },
        platform: { type: String, default: 'web' },
      },
    ],
    portfolioItems: { type: [talentPortfolioItemSchema], default: [] },
    completedContractsCount: { type: Number, default: 0 },
    escrowVolumeEarned: { type: Number, default: 0 },
    ratingAverage: { type: Number, default: 5.0 },
    ratingCount: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 5.0 },
    qualityScore: { type: Number, default: 5.0 },
    reliabilityScore: { type: Number, default: 5.0 },
    professionalismScore: { type: Number, default: 5.0 },
    ratingBreakdown: {
      type: new Schema(
        {
          fiveStar: { type: Number, default: 0 },
          fourStar: { type: Number, default: 0 },
          threeStar: { type: Number, default: 0 },
          twoStar: { type: Number, default: 0 },
          oneStar: { type: Number, default: 0 },
        },
        { _id: false }
      ),
      default: () => ({ fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 }),
    },
  },
  {
    collection: 'talent_profiles',
    timestamps: true,
  }
);

talentProfileSchema.index({
  headline: 'text',
  bio: 'text',
  skills: 'text',
  specializations: 'text',
  industries: 'text',
});

talentProfileSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const TalentProfile: Model<ITalentProfile> =
  mongoose.models.TalentProfile || mongoose.model<ITalentProfile>('TalentProfile', talentProfileSchema);
