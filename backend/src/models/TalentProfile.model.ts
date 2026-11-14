import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ITalentProfile {
  _id?: Types.ObjectId;
  id: string;
  userId: Types.ObjectId | string;
  headline: string;
  bio: string;
  skills: string[];
  hourlyRate: number;
  minimumProjectBudget: number;
  availabilityStatus: 'available' | 'busy' | 'not_looking';
  availableSpotsThisMonth: number;
  portfolioLinks: { title: string; url: string; platform: string }[];
  completedContractsCount: number;
  escrowVolumeEarned: number;
  ratingAverage: number;
  ratingCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const talentProfileSchema = new Schema<ITalentProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    headline: { type: String, default: '', trim: true },
    bio: { type: String, default: '', trim: true },
    skills: { type: [String], default: [] },
    hourlyRate: { type: Number, default: 0 },
    minimumProjectBudget: { type: Number, default: 500 },
    availabilityStatus: { type: String, enum: ['available', 'busy', 'not_looking'], default: 'available' },
    availableSpotsThisMonth: { type: Number, default: 2 },
    portfolioLinks: [
      {
        title: { type: String, default: '' },
        url: { type: String, default: '' },
        platform: { type: String, default: 'web' },
      },
    ],
    completedContractsCount: { type: Number, default: 0 },
    escrowVolumeEarned: { type: Number, default: 0 },
    ratingAverage: { type: Number, default: 5.0 },
    ratingCount: { type: Number, default: 0 },
  },
  {
    collection: 'talent_profiles',
    timestamps: true,
  }
);

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

