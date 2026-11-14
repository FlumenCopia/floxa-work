import mongoose, { Schema, Model, Types } from 'mongoose';

export type ReviewRole = 'client_to_freelancer' | 'freelancer_to_client';
export type ReviewStatus = 'pending_mutual' | 'published' | 'flagged' | 'hidden';

export interface IReview {
  _id?: Types.ObjectId;
  id: string;
  contractId: Types.ObjectId | string;
  briefId?: Types.ObjectId | string;
  reviewerId: Types.ObjectId | string;
  targetId: Types.ObjectId | string;
  role: ReviewRole;
  overallRating: number;
  communicationRating: number;
  professionalismRating: number;
  qualityRating: number;
  reliabilityRating: number;
  reviewText: string;
  status: ReviewStatus;
  isEdited: boolean;
  editedAt?: Date;
  publishedAt?: Date;
  flagReason?: string;
  moderatorNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    briefId: { type: Schema.Types.ObjectId, ref: 'Brief', index: true, default: null },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: {
      type: String,
      enum: ['client_to_freelancer', 'freelancer_to_client'],
      required: true,
      index: true,
    },
    overallRating: { type: Number, required: true, min: 1, max: 5 },
    communicationRating: { type: Number, required: true, min: 1, max: 5 },
    professionalismRating: { type: Number, required: true, min: 1, max: 5 },
    qualityRating: { type: Number, required: true, min: 1, max: 5 },
    reliabilityRating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true, minlength: 10, maxlength: 2000, trim: true },
    status: {
      type: String,
      enum: ['pending_mutual', 'published', 'flagged', 'hidden'],
      default: 'pending_mutual',
      index: true,
    },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    flagReason: { type: String, default: '' },
    moderatorNotes: { type: String, default: '' },
  },
  {
    collection: 'reviews',
    timestamps: true,
  }
);

// Compound unique index ensuring only one review per reviewer per contract
reviewSchema.index({ contractId: 1, reviewerId: 1 }, { unique: true });
reviewSchema.index({ targetId: 1, status: 1 });

reviewSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);
