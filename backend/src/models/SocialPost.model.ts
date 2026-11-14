import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ISocialPost {
  _id?: Types.ObjectId;
  id: string;
  authorId: Types.ObjectId | string;
  caption: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'carousel';
  tags: string[];
  projectCategory: 'branding' | 'uiux' | 'webdev' | 'mobile' | 'marketing' | 'consulting';
  caseStudyMetrics?: {
    timeTakenDays?: number;
    deliverableType?: string;
    verifiedFloxaWork?: boolean;
  };
  likesCount: number;
  commentsCount: number;
  likedBy: (Types.ObjectId | string)[];
  createdAt?: Date;
  updatedAt?: Date;
}

const socialPostSchema = new Schema<ISocialPost>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    caption: { type: String, required: true, trim: true },
    mediaUrls: { type: [String], default: [] },
    mediaType: { type: String, enum: ['image', 'video', 'carousel'], default: 'image' },
    tags: { type: [String], default: [], index: true },
    projectCategory: {
      type: String,
      enum: ['branding', 'uiux', 'webdev', 'mobile', 'marketing', 'consulting'],
      default: 'branding',
      index: true,
    },
    caseStudyMetrics: {
      timeTakenDays: { type: Number, default: 0 },
      deliverableType: { type: String, default: '' },
      verifiedFloxaWork: { type: Boolean, default: false },
    },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    collection: 'social_posts',
    timestamps: true,
  }
);

socialPostSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const SocialPost: Model<ISocialPost> =
  mongoose.models.SocialPost || mongoose.model<ISocialPost>('SocialPost', socialPostSchema);

