import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IFile {
  _id?: Types.ObjectId;
  id: string;
  ownerId: Types.ObjectId | string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: 'deliverable' | 'avatar' | 'post' | 'attachment' | 'general';
  storagePath: string;
  accessUrl: string;
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const fileSchema = new Schema<IFile>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    filename: { type: String, required: true, unique: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    category: {
      type: String,
      enum: ['deliverable', 'avatar', 'post', 'attachment', 'general'],
      default: 'general',
      index: true,
    },
    storagePath: { type: String, required: true },
    accessUrl: { type: String, required: true },
    isPublic: { type: Boolean, default: false },
  },
  {
    collection: 'files',
    timestamps: true,
  }
);

fileSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const FileRecord: Model<IFile> =
  mongoose.models.FileRecord || mongoose.model<IFile>('FileRecord', fileSchema);

