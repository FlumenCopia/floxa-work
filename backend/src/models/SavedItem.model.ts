import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ISavedItem {
  _id?: Types.ObjectId;
  id: string;
  userId: Types.ObjectId | string;
  itemType: 'freelancer' | 'project';
  itemId: Types.ObjectId | string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const savedItemSchema = new Schema<ISavedItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    itemType: { type: String, enum: ['freelancer', 'project'], required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, required: true, index: true },
    notes: { type: String, default: '' },
  },
  {
    collection: 'saved_items',
    timestamps: true,
  }
);

// Prevent duplicate saves of the same item by the same user
savedItemSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

savedItemSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const SavedItem: Model<ISavedItem> =
  mongoose.models.SavedItem || mongoose.model<ISavedItem>('SavedItem', savedItemSchema);

